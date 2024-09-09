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
    private AUTH0_AUDIENCE: string;
    private AUTH0_DOMAIN: string;
    private readonly logger = new Logger(CustomAuthGuard.name);
  
    constructor(private configService: ConfigService) {
      this.AUTH0_AUDIENCE = configService.get('AUTH0_AUDIENCE');
      this.AUTH0_DOMAIN = configService.get('AUTH0_DOMAIN');
      this.logger.debug(`AUTH0_AUDIENCE: ${this.AUTH0_AUDIENCE}`);
      this.logger.debug(`AUTH0_DOMAIN: ${this.AUTH0_DOMAIN}`);
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.getArgByIndex(0);
      const res = context.getArgByIndex(1);
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
        const validation = await checkJwt(req, res, (res) =>
          this.logger.log(`checkJwt res: ${res}`),
        );
        this.logger.log(`validation: ${JSON.stringify(validation)}`);
        if (!validation) {
          throw new UnauthorizedException();
        }
        return true;
      } catch (error) {
        this.logger.log('something');
        this.logger.log(error);
        throw new UnauthorizedException(error);
      }
    }
  }
  