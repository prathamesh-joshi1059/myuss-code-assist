import { Storage } from '@google-cloud/storage';
import { Injectable, Logger } from '@nestjs/common';
import { Message, PubSub } from '@google-cloud/pubsub';
import { FirestoreService } from '../../backend/google/firestore/firestore.service';
import { PlytixWebhookCallReqDTO } from '../models/plytix-webhook-call-req.dto';
import { validate, ValidationError } from 'class-validator';
import csvtojson from 'csvtojson';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ValidateFeedDataDto } from '../models/validate-feed-data.dto';
import { PlytixProductMapper } from '../mappers/plytix-product.mapper';
import { PlytixProductModel } from '../models/plytix.model';

@Injectable()
export class PlytixService {
  private pubSubClient: PubSub;
  private subscriptionName: string;
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
    this.subscriptionName = this.configService.get<string>('PUB_SUB_SUBSCRIPTION');
    this.listenForMessages();
  }

  async plytixWebhookCall(plytixWebhookCallReqDto: PlytixWebhookCallReqDTO): Promise<void> {
    try {
      const { processed_products, feed_url, channel_processing_status } = plytixWebhookCallReqDto;
      const domain = new URL(feed_url).hostname;
      if (!this.isDomainWhitelisted(domain)) {
        this.logger.error(`Error in plytixWebhookCall function: Domain for feed_url is not whitelisted: ${domain}`);
        return;
      }
      if (this.isRateLimited(feed_url)) {
        this.logger.error(`Error in plytixWebhookCall function: Rate limit exceeded for plytixWebhookCall`);
        return;
      }
      if (channel_processing_status !== 'success' || processed_products <= 0) {
        this.logger.error(
          `Error in plytixWebhookCall function: CSV file not processed. processed_products: ${processed_products}, channel_processing_status: ${channel_processing_status}`,
        );
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
        this.logger.log(`In plytixWebhookCall function: csv file saved: ${filename}`);
      }
    } catch (error) {
      const functionName = this.extractFunctionNameFromError(error);
      this.logger.error(
        `Error in plytixWebhookCall function: Error = ${error.message} : detail error stack = ${functionName}`,
      );
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
        const errors: ValidationError[] = await validate(dto);
        if (errors.length) {
          throw new Error(`Schema validation failed: ${errors.length} errors found.`);
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  private async listenForMessages(): Promise<void> {
    try {
      const subscription = this.pubSubClient.subscription(this.subscriptionName);
      subscription.on('message', (message) => this.messageHandler(message));
      this.logger.log(`Listening for messages on ${this.subscriptionName}`);
    } catch (error) {
      this.logger.error(`Error initializing subscription: ${error.message}`);
    }
  }

  private async messageHandler(message: Message): Promise<void> {
    try {
      const messageBody = JSON.parse(message.data.toString());
      const fileName = messageBody.name;
      this.logger.log(`In messageHandler function: detected file change in bucket: file name = ${fileName}`);
      await this.processPubsubMessage(fileName);
      message.ack();
    } catch (error) {
      this.logger.error(`Error in messageHandler function: Error processing message: ${error}`);
    }
  }

  async processPubsubMessage(fileName: string): Promise<void> {
    try {
      const [fileBuffer] = await this.storage.bucket(this.bucketName).file(fileName).download();
      const fileContents = fileBuffer.toString('utf8');
      await this.validateFeedData(fileContents);
      const jsonData = await csvtojson().fromString(fileContents);
      const documents: { [id: string]: PlytixProductModel } = {};
      for (const record of jsonData) {
        const modifiedJson = await this.removeSpacesFromKeys(record);
        const mappedData = PlytixProductMapper.mapToPlytixProduct(modifiedJson);
        const plainMappedData = this.convertToPlainObject(mappedData) as PlytixProductModel;
        if ('sku' in plainMappedData) {
          documents[plainMappedData.sku] = plainMappedData;
        } else {
          this.logger.warn(`Skipping record without SKU: ${JSON.stringify(plainMappedData)}`);
        }
      }

      await this.firestoreService.batchUpsertDocuments<PlytixProductModel>('plytixProducts', documents);
      this.logger.log(`In processPubsubMessage function: Processed all products from ${fileName} file`);
    } catch (error) {
      const functionName = this.extractFunctionNameFromError(error);
      this.logger.error(
        `Error in processPubsubMessage function: Error in file ${fileName} from storage: Error = ${error.message} : detail error stack = ${functionName}`,
      );
      throw error;
    }
  }

  private async removeSpacesFromKeys(obj: Record<string, any>): Promise<Record<string, any>> {
    const newJson: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = key.replace(/\s+/g, '');
      newJson[newKey] = value;
    }
    return newJson;
  }

  private convertToPlainObject(instance: any): object {
    return instance && typeof instance.toJSON === 'function' ? instance.toJSON() : { ...instance };
  }

  private extractFunctionNameFromError(error: Error): string {
    return error.stack?.match(/at (.*) \(/)?.[1] || 'Unknown function';
  }
}