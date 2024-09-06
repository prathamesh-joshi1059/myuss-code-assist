import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class PaymentMethodAuthGuard implements CanActivate {
  private secret: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.secret = this.configService.get('JWT_SECRET');
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // for the payment method update, the JWT generated in the first step will be returned in the second step
    const token = request.body.orderUpdateJWT;
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }
    // verify the JWT and get the payload
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, { secret: this.secret });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    // confirm that the accountNo and orderNo in the JWT match the accountNo and orderNo in the request body
    if (payload.accountNo !== request.body.accountNo || payload.orderNo !== request.body.orderNo) {
      throw new UnauthorizedException('Token does not match accountNo and orderNo');
    }
    return true;
  }

}
