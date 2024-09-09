import { Module } from '@nestjs/common';
import { RecaptchaService } from './recaptcha/recaptcha.service';
import { FirestoreService } from './firestore/firestore.service';
import { CoreModule } from '../../core/core.module';
import { GoogleMapsService } from './google-maps/google-maps.service';

@Module({
  imports: [CoreModule],
  providers: [RecaptchaService, FirestoreService, GoogleMapsService],
  exports: [RecaptchaService, FirestoreService, GoogleMapsService],
})
export class GoogleModule {}