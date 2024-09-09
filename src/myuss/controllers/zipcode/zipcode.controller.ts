import { Body, Controller, Post, Req , UseFilters } from '@nestjs/common';
import { ZipcodeService } from '../../../myuss/services/zipcode/zipcode.service';


import {
  ApiBadRequestResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoggerService } from '../../../core/logger/logger.service';
import { ZipcodeReqDTO } from './dto/zipcode-req.dto';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { ZipcodeRespDto } from './dto/zipcode-resp.dto';


@UseFilters(ThrottlerExceptionFilter)
@ApiTags('zipcodes')
@Controller('zipcodes')
export class ZipCodeController {
  constructor(private zipcodeService: ZipcodeService, private logger: LoggerService) {}

  @Post()
  //Open API Documentation - Expected Success Response
  @ApiResponse({ status: 1000, description: 'Success', type: ApiRespDTO })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Zip code must be string',
  })
  async checkServiceableZipcode(@Body() request: ZipcodeReqDTO): Promise<ApiRespDTO<ZipcodeRespDto | Object>> {
    const zipcodeRespObj = await this.zipcodeService.checkServiceableZipcode(request.postalCode);
    this.logger.info(`zipcodeResponse: ${JSON.stringify(zipcodeRespObj)}`);
    return zipcodeRespObj;
  }
}