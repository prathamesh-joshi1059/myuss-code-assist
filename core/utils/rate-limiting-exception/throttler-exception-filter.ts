import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const throttlerResp = new ApiRespDTO<any>({
      success: false,
      status: 1022,
      message: 'Too many requests are sent to us. Please try again later.',
      data: [],
    });
    
    response.status(429).json(throttlerResp);
  }
}