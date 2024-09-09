import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { LastLoginUpdateDto } from '../../controllers/user/dto/last-login-update.dto';
import { UserService } from '../../../myuss/services/user/user.service';
import { SysadminGuard } from '../../../auth/sysadmin/sysadmin.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { SfdcGuard } from '../../../auth/sfdc/sfdc.guard';
import { ApiTags } from '@nestjs/swagger';

@UseGuards(SfdcGuard)
@Controller('api/auth0')
@ApiTags('auth0')
export class Auth0Controller {
    constructor(private userService : UserService,
                private logger : LoggerService) {}

  @Post('/last-login')
  async updateLastLogin( @Body() body: LastLoginUpdateDto):Promise<ApiRespDTO<Object>> {
    try {
      const lastLoginResp =  await this.userService.updateLastLogin(body.emailId);
      return lastLoginResp;
    } catch (err) {
      this.logger.error(err);
      const lastLoginResp = {
        status: 1026,
        message: 'Update Last Login Failed',
        data: { error: err },
      };
      return lastLoginResp;
    }
  }
}
