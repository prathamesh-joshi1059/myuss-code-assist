import { Injectable } from '@nestjs/common';
import { AddressType, Client, GeocodeResponse } from '@googlemaps/google-maps-services-js';
import { LoggerService } from '../../../core/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';


@Injectable()
export class GoogleMapsService {
  private client: Client;
  private apiKey: string;

  constructor(private logger: LoggerService, private configService: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
  }

  public async getStateCodeByZip(zip: string): Promise<string> {
    const resp = await this.getGeocodeByAddress(zip);
    this.logger.info('getStateByZip', resp.data);
    try {
      const state = resp.data.results[0].address_components.find(component => component.types.includes(<AddressType>'administrative_area_level_1')).short_name;
      return state;
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }

  public async getStateNameByZip(zip: string): Promise<string> {
    try {
      const resp = await this.getGeocodeByAddress(zip);
      this.logger.info('getStateByZip', resp.data);
      if (resp.data.results.length === 0) {
        return null;
      }
      const state = resp.data.results[0].address_components?.find(component => component.types.includes(<AddressType>'administrative_area_level_1'))?.long_name;
      return state;
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }

  public async getGeocodeByAddress(address: string): Promise<GeocodeResponse> {
    // restrict to US addresses
    return this.client.geocode({
      params: {
        key: this.apiKey,
        address: address,
        components: {
          country: 'US'
        }
      }
    });
  }

  public async getTimeZoneByAddress(siteAddress:string) {
    const apiKey = this.apiKey;
    if (!siteAddress) {
      return null;
    }
    try {
      const geocodeResponse = await this.getGeocodeByAddress(siteAddress)
      if (geocodeResponse.data.status !== 'OK') {
        return null
      }

      const location = geocodeResponse.data?.results[0]?.geometry?.location;
      const timestamp = Math.floor(Date.now() / 1000);
      const timeZoneResponse = await this.client.timezone({
           params: {
          location: `${location?.lat},${location?.lng}`,
          timestamp: timestamp,
          key: apiKey,
        }
      })

      if (timeZoneResponse.data.status != 'OK') {
        return null
      }

      const timeZone = timeZoneResponse?.data?.timeZoneName;
      const resultedTimeZone = (() => {
        switch (timeZone) {
          case 'Central Daylight Time':
          case 'Central Standard Time':
            return 'Central';
          case 'Eastern Daylight Time':
          case 'Eastern Standard Time':
            return 'East';
          case 'Mountain Daylight Time':
          case 'Mountain Standard Time':
            return 'Mountain';
          case 'Pacific Daylight Time':
          case 'Pacific Standard Time':
            return 'Pacific';
          default:
            return '';
        }
      })();
      return resultedTimeZone;
    } catch (error) {
      return null
    }
  }
}

