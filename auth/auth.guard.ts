import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { expressJwtSecret } from 'jwks-rsa';
import { expressjwt, GetVerificationKey } from 'express-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomAuthGuard implements CanActivate {
  private readonly logger = new Logger(CustomAuthGuard.name);
  private readonly AUTH0_AUDIENCE: string;
  private readonly AUTH0_DOMAIN: string;

  constructor(private configService: ConfigService) {
    this.AUTH0_AUDIENCE = configService.get('AUTH0_AUDIENCE');
    this.AUTH0_DOMAIN = configService.get('AUTH0_DOMAIN');
    this.logger.debug(`AUTH0_AUDIENCE: ${this.AUTH0_AUDIENCE}`);
    this.logger.debug(`AUTH0_DOMAIN: ${this.AUTH0_DOMAIN}`);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const checkJwt = expressjwt({
      secret: expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${this.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }) as GetVerificationKey,
      audience: this.AUTH0_AUDIENCE,
      issuer: `https://${this.AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    });

    try {
      await checkJwt(req, res);
      return true;
    } catch (error) {
      this.logger.error('Unauthorized access', error);
      throw new UnauthorizedException(error);
    }
  }
}