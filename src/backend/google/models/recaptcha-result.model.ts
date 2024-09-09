export class RecaptchaResponse {
  success: boolean;
  failureReason: string;
  message: string;
  
  constructor() {
    this.success = false;
    this.failureReason = 'recaptcha validation not completed';
  }
}