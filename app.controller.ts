import { Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  randomNumDbs = Math.floor(Math.random() * 10);
  constructor(
    private readonly appService: AppService,
  ) {}

  @Get()
  async getHello(): Promise<any> {
    try {
      return this.appService.getHello();
    } catch (err) {
      console.error(err);
      return err;
    }
  }
}
