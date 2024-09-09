import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../../core/logger/logger.service';

@Injectable()
export class AdminGuard implements CanActivate {
  adminKey: string;

  constructor(private configService: ConfigService, private logger: LoggerService) {
    this.adminKey = this.getAdminKey();
  }

  getAdminKey() {
    const adminKey = this.configService.get<string>('ADMIN_KEY');
    // if the admin key hasn't been set, generate a random one
    if (!adminKey) {
      this.logger.error('ADMIN_KEY not found in environment variables');
      return uuidv4();
    } 
    return adminKey;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = this.extractAdminKeyFromHeader(request);
    if (!key) {
      throw new UnauthorizedException();
    }
    const isValid = this.validateKey(key);
    if (!isValid) {
      throw new UnauthorizedException('Invalid key');
    }
    return isValid;
  }

  private validateKey(key: string): boolean {
    return key === this.adminKey;
  }

  private extractAdminKeyFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'AdminKey' ? token : undefined;
  }

}
