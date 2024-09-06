import { Storage } from '@google-cloud/storage';
import { Injectable, Logger } from '@nestjs/common';
import { Message, PubSub } from '@google-cloud/pubsub';
import { FirestoreService } from '../../backend/google/firestore/firestore.service';
import { PlytixWebhookCallReqDTO } from '../models/plytix-webhook-call-req.dto';
import { validate } from 'class-validator';
import csvtojson from 'csvtojson';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ValidateFeedDataDto } from '../models/validate-feed-data.dto';
import { PlytixProductMapper } from '../mappers/plytix-product.mapper';
import { PlytixProductModel } from '../models/plytix.model';

@Injectable()
export class PlytixService {
  private pubSubClient: PubSub;
  private storage: Storage;
  private readonly logger: Logger;
  private readonly bucketName: string;
  private whitelist: string[];
  private limits: { [key: string]: { count: number; lastReset: Date } } = {};

  constructor(private firestoreService: FirestoreService, private configService: ConfigService) {
    this.logger = new Logger(PlytixService.name);
    this.pubSubClient = new PubSub();
    this.storage = new Storage();
    this.bucketName = this.configService.get<string>('GCS_BUCKET');
    this.whitelist = [this.configService.get<string>('WHITELIST_FEED_URL')];
    this.listenForMessages();
  }

  async plytixWebhookCall(plytixWebhookCallReqDto: PlytixWebhookCallReqDTO) {
    try {
      const { processed_products, feed_url, channel_processing_status } = plytixWebhookCallReqDto;
      const domain = new URL(feed_url).hostname;
      if (!this.isDomainWhitelisted(domain)) {
        this.logger.error(`Domain for feed_url is not whitelisted: ${domain}`);
        return;
      }
      if (this.isRateLimited(feed_url)) {
        this.logger.error(`Rate limit exceeded for plytixWebhookCall`);
        return;
      }
      if (channel_processing_status !== 'success' || processed_products <= 0) {
        this.logger.error(`CSV file not processed. processed_products: ${processed_products}, channel_processing_status: ${channel_processing_status}`);
        return;
      }
      const response = await axios.get(feed_url);
      const csvData = response.data;
      const timestamp = new Date().toISOString();
      const filename = `plytix-feed-${timestamp}.csv`;
      const validationPassed = await this.validateFeedData(csvData);
      if (validationPassed) {
        const file = this.storage.bucket(this.bucketName).file(filename);
        await file.save(csvData, {
          contentType: 'text/csv',
          resumable: false,
        });
        this.logger.log(`CSV file saved: ${filename}`);
      }
    } catch (error) {
      const functionName = error.stack.match(/at (.*) \(/)[1];
      this.logger.error(`Error = ${error.message} : detail error stack = ${functionName}`);
      throw error;
    }
  }

  private isDomainWhitelisted(domain: string): boolean {
    return this.whitelist.some((whitelistedDomain) => domain.startsWith(whitelistedDomain));
  }

  private isRateLimited(feed_url: string): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const limitKey = feed_url + today.toISOString();

    if (!this.limits[limitKey]) {
      this.limits[limitKey] = { count: 0, lastReset: today };
    }
    if (this.limits[limitKey].count >= 5) {
      return true;
    }
    this.limits[limitKey].count++;
    return false;
  }

  async validateFeedData(csvData: string): Promise<boolean> {
    try {
      const jsonData = await csvtojson().fromString(csvData);
      if (!jsonData.length) {
        throw new Error('No data found in the CSV file.');
      }
      if (jsonData.length === 1 && Object.keys(jsonData[0]).every((key) => key.trim() === '')) {
        throw new Error('No data found in the CSV file, only headers.');
      }
      const itemsWithoutSKU = jsonData.filter((item) => !item.SKU);
      if (itemsWithoutSKU.length) {
        throw new Error(`Some products are missing SKU (${itemsWithoutSKU.length} products).`);
      }
      for (const item of jsonData) {
        const dto = new ValidateFeedDataDto();
        Object.assign(dto, item);
        const errors = await validate(dto);
        if (errors.length) {
          throw new Error(`Schema validation failed: ${errors.length} errors found.`);
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  private async listenForMessages() {
    try {
      const subscription = this.pubSubClient.subscription(this.configService.get<string>('PUB_SUB_SUBSCRIPTION'));
      if (subscription) {
        subscription.on('message', (message) => this.messageHandler(message));
        this.logger.log(`Listening for messages on ${this.configService.get<string>('PUB_SUB_SUBSCRIPTION')}`);
      } else {
        this.logger.error(`Subscription not found`);
      }
    } catch (error) {
      this.logger.error(`Error initializing subscription: ${error.message}`);
    }
  }

  private async messageHandler(message: Message) {
    try {
      const messageBody = JSON.parse(message.data.toString());
      const fileName = messageBody.name;
      this.logger.log(`Detected file change in bucket: file name = ${fileName}`);
      await this.processPubsubMessage(fileName);
      message.ack();
    } catch (error) {
      this.logger.error(`Error processing message: ${error}`);
    }
  }

  async processPubsubMessage(fileName: string) {
    try {
      const [fileBuffer] = await this.storage.bucket(this.bucketName).file(fileName).download();
      const fileContents = fileBuffer.toString('utf8');
      await this.validateFeedData(fileContents);
      const jsonData = await csvtojson().fromString(fileContents);
      const documents: { [id: string]: PlytixProductModel } = {};
      for (const record of jsonData) {
        const modifiedJson = this.removeSpacesFromKeys(record);
        const mappedData = PlytixProductMapper.mapToPlytixProduct(modifiedJson);
        const plainMappedData = this.convertToPlainObject(mappedData);
        documents[plainMappedData.sku] = plainMappedData;
      }

      await this.firestoreService.batchUpsertDocuments<PlytixProductModel>('plytixProducts', documents);
      this.logger.log(`Processed all products from ${fileName} file`);
    } catch (error) {
      const functionName = error.stack.match(/at (.*) \(/)[1];
      this.logger.error(`Error in file ${fileName}: Error = ${error.message} : detail error stack = ${functionName}`);
      throw error;
    }
  }

  private removeSpacesFromKeys(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key.replace(/\s+/g, ''), value])
    );
  }

  private convertToPlainObject(instance: any): Record<string, any> {
    if (instance && typeof instance.toJSON === 'function') {
      return instance.toJSON();
    }
    return { ...instance };
  }
}