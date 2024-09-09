import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  randomNumDbs: number = Math.floor(Math.random() * 10);

  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    try {
      return await this.appService.getHello();
    } catch (err) {
      console.error(err);
      throw err; // Rethrowing the error for better error handling
    }
  }
}