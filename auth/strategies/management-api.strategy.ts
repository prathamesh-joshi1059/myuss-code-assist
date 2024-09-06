import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class ManagementAPIStrategy extends PassportStrategy(Strategy, 'auth0-management-api') {
  private readonly logger = new Logger(this.name);
  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `${process.env.AUTH0_MANAGEMENT_URL}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: any) {
    this.logger.debug(`validate payload: ${JSON.stringify(payload)}`);
    this.logger.debug(`payload: ${JSON.stringify(payload)}`);
    return payload;
  }
}
