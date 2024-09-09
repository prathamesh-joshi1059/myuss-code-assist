import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private secret: string;
  private expiresIn: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.secret = this.configService.get('JWT_SECRET');
    this.expiresIn = this.configService.get('JWT_EXPIRES_IN');
  }

  public async generateRFQToken(rfq_id: string): Promise<string> {
    const payload = { rfq_id };
    return this.jwtService.signAsync(payload, 
      { secret: this.secret, expiresIn: this.expiresIn });
  }

  public async generatePaymentInfoToken(accountId: string, orderNo: string): Promise<string> {
    const payload = { accountNo: accountId, orderNo: orderNo };
    return this.jwtService.signAsync(payload, 
      { secret: this.secret, expiresIn: this.expiresIn });
  }


}
