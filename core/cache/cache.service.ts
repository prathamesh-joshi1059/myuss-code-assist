import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService {

  constructor(
    private logger: LoggerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async get<T>(key: string): Promise<T> {
    // simple error handling
    try {
      return await this.cacheManager.get(key);
    } catch (error) {
      this.logger.error('error in CacheService.get', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number) {
    try {
      if (ttl) {
        return await this.cacheManager.set(key, value, ttl);
      } else {
        return await this.cacheManager.set(key, value);
      }
    } catch (error) {
      this.logger.error('error in CacheService.set', error);
      return null;
    }
    
  }

  async del(key: string) {
    try {
      return await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error('error in CacheService.del', error);
      return null;
    }
  }

  async reset(): Promise<boolean> {
    try {
      await this.cacheManager.reset();
      return true;
    } catch (error) {
      this.logger.error('error in CacheService.reset', error);
      return false;
    }
  }
  //get all keys
  async allKeys(): Promise<string[]> {
    try {
      return await this.cacheManager.store.keys();
    } catch (error) {
      this.logger.error('error in CacheService.keys', error);
      return null;
    }
  }

}
