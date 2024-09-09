import { Injectable } from '@nestjs/common';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import { ConfigService } from '@nestjs/config';
import { RecaptchaResponse } from '../models/recaptcha-result.model';
import { LoggerService } from '../../../core/logger/logger.service';

@Injectable()
export class RecaptchaService {
  private client: RecaptchaEnterpriseServiceClient;
  private projectId: string;
  private projectPath: string;
  private recaptchaKey: string;
  private bypassRecaptcha: boolean;

  constructor(private configService: ConfigService, private logger: LoggerService) {
    this.client = new RecaptchaEnterpriseServiceClient();
    this.projectId = this.configService.get<string>('GCP_PROJECT_NAME');
    this.recaptchaKey = this.configService.get<string>('RECAPTCHA_KEY');
    this.bypassRecaptcha = this.configService.get<string>('BYPASS_RECAPTCHA') === 'true';
  }

  public async verifyRecaptcha(token: string, action: string): Promise<RecaptchaResponse> {
    // allow bypassing recaptcha for testing
    this.projectPath = this.client.projectPath(this.projectId);
    let reCaptchaResult = new RecaptchaResponse();

    // check for missing token
    if (!token) {
      reCaptchaResult.failureReason = 'missing token';
      return reCaptchaResult;
    }

    if (!this.bypassRecaptcha) {
      reCaptchaResult = await this.createAssessment(token, action);
    } else {
      reCaptchaResult = this.getTestRecaptchaResult();
    }
    
    return reCaptchaResult;
  }

  private getTestRecaptchaResult(): RecaptchaResponse {
    const reCaptchaResult = new RecaptchaResponse();
    reCaptchaResult.success = true;
    reCaptchaResult.failureReason = '';
    reCaptchaResult.message = 'bypassRecaptcha is true';
    return reCaptchaResult;
  }

  private async createAssessment(token: string, action: string): Promise<RecaptchaResponse> {
    this.projectPath = this.client.projectPath(this.projectId);
    const result = new RecaptchaResponse();

    // Build the assessment request.
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: this.recaptchaKey,
        },
      },
      parent: this.projectPath,
    };

    const [response] = await this.client.createAssessment(request);

    // Check if the token is valid.
    if (!response.tokenProperties.valid) {
      result.success = false;
      result.failureReason = response.tokenProperties?.invalidReason?.toString();
      return result;
    } else {
      result.success = true;
      result.failureReason = '';
    }

    return result;
  }
}