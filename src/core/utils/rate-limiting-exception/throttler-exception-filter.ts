// throttler-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    let throttlerResp = new ApiRespDTO<any>();

    // Customize the response when throttling limit is exceeded

    throttlerResp.success = false;
    throttlerResp.status = 1022;
    throttlerResp.message = 'Too many requests are sent to us. Please try again later.';
    throttlerResp.data = [];
    response.status(429).json(throttlerResp);
  }
}
