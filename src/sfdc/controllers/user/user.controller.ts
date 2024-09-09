import { Body,Controller, HttpException, Post, UseGuards } from '@nestjs/common';
import { SfdcGuard } from '../../../auth/sfdc/sfdc.guard';
import { ChangePasswordReqDto } from '../../../myuss/controllers/user/dto/change-password-req.dto';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { LoggerService } from '../../../core/logger/logger.service';
import { Auth0User, ErrorMessage } from '../../../backend/auth0/model/auth0.model';
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
import { Auth0UserService } from '../../../backend/auth0/services/auth0-user/auth0-user.service';
import { ApiTags } from '@nestjs/swagger';
@Controller('sfdc/user')
@ApiTags('sfdc')
@UseGuards(SfdcGuard)
export class UserController {
    constructor(
        private auth0Service: Auth0MyUSSAPIService,
        private logger: LoggerService,
        private auth0UserService: Auth0UserService){}
    
  @Post('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordReqDto): Promise<ApiRespDTO<any>> {
    let changePasswordResp = new ApiRespDTO<any>();
    try {
      const resp = await this.auth0Service.changePassword(
        changePasswordDto.email,
      );
      if(resp['ticket'] != undefined){
        changePasswordResp = {
          success:true,
          message: 'Success',
          status: 1000,
          data : { ticket:resp['ticket'] },
        }
      }else{
        changePasswordResp =  { success:false, message: 'Error from auth0', status: 1013 ,data: {}};
      }
    } catch (err) {
      this.logger.error(err);
      changePasswordResp =  { success:false, message: 'Fail', status: 1012 ,data:{ error: err }};
      throw new HttpException('Error from auth0', 1013);
    }
    return changePasswordResp;
  }
  @Post('create_user')
  async createUser(@Body() user:Auth0User): Promise<ApiRespDTO<any>> {
    try {
      const resp : Auth0User | ErrorMessage = await this.auth0UserService.createUser(user);
        if(resp.hasOwnProperty('message')){
          //fail case
          return  {
            status: 1012,
            message: 'User already exists.',
            data: { error: "error in auth0"},
          };
        }else{
          const changePasswordResp = await this.auth0UserService.changePasswordInteractive(user.email);
          return  {
            status: 1000,
            message: 'Success',
            data: {...resp}
          };
        }
        
    } catch (err) {
      this.logger.error('error in createUser controller', err);
      const signupResp = {
        status: 1013,
        message: 'Error from auth0',
        data: { error: err },
      };
      return signupResp;
    }
  }
}
