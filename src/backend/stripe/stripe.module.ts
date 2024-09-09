import { Module } from '@nestjs/common';
import { StripeService } from './services/stripe/stripe.service';

@Module({
  controllers: [],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}