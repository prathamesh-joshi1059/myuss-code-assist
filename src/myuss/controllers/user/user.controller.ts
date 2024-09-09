import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  UseGuards,
  Request,
  UseFilters,
  Delete,
  Query,
  Param
} from '@nestjs/common';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { ChangePasswordReqDto } from './dto/change-password-req.dto';
import { LoggerService } from '../../../core/logger/logger.service';
import { UserService } from '../../../myuss/services/user/user.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SignupReqDTO } from './dto/signup-req.dto';
import { UpdateProfileReqDTO } from './dto/update-profile-req.dto';
import { ApiRespDTO  } from '../../../common/dto/api-resp.dto';
import { FetchUserReqDTO } from './dto/fetch-user-req.dto';
import { ChangePasswordRespDto } from './dto/change-password-resp.dto';
import { ThrottlerExceptionFilter } from '../../../core/utils/rate-limiting-exception/throttler-exception-filter';
import { SysadminGuard } from '../../../auth/sysadmin/sysadmin.guard';
import { UserDetails } from '../../models';
import { AccountIdGuard } from '../../../myuss/custom-guard/accountId.guard';
import { AddUpdateUserContactForAccountReqDto } from './dto/add-user-from-account-req.dto';
import { FetchUserContactsForAccountReqDto } from './dto/fetch-user-contacts-for-account-req-dto';


@UseFilters(ThrottlerExceptionFilter)
@ApiBearerAuth()
@ApiTags('users')
@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  
  constructor(
    private userService: UserService,
    private auth0Service: Auth0MyUSSAPIService,
    private logger: LoggerService
  ) {}

  @Get('me')
  async getMe(@Request() req: Object): Promise<ApiRespDTO<UserDetails | object>> {
    const user = await this.userService.fetchUsersDetails(req["user"]["sub"]);
    return user;
  }

  @Post('me/request-email-verification')
  async requestEmailVerification(@Request() req: Object): Promise<ApiRespDTO<object>> {
    const user = await this.userService.requestEmailVerification(req["user"]["sub"]);
    return user;
  }

  //fetch user profile details
  @Post('fetch-user')
  async fetchUsersDetails(@Request() req: Object,@Body() body: FetchUserReqDTO): Promise<ApiRespDTO<object | UserDetails>> {
      if(req["user"]["sub"] !== body.Id){
        throw new HttpException('Unauthorized', 401);
      }
      const fetchUserProfileResp = await this.userService.fetchUsersDetails(body.Id);
      return fetchUserProfileResp;
  }

  //change password create link
  @Post('change-password')
  async changePassword(@Request() req: Object,@Body() changePasswordDto: ChangePasswordReqDto): Promise<ChangePasswordRespDto> {
    let hasAccess = await this.userService.hasAccessToAccount(req["user"]["sub"], {"email":changePasswordDto.email}, "email")
    let changePasswordResp = new ChangePasswordRespDto();
    if (!hasAccess) {
      throw new HttpException('Unauthorized', 401);
    }
    try {
      const resp = await this.auth0Service.changePassword(
        changePasswordDto.email,
      );
      if(resp['ticket'] != undefined){
        changePasswordResp = {
          success:true,
          message: 'Success',
          status: 1000,
          ticket:resp['ticket'],
        }
      }else{
        changePasswordResp =  { success:false,message: 'Fail', status: 1012 ,ticket:""};
      }
    } catch (err) {
      this.logger.error(err);
      changePasswordResp =  { success:false,message: 'Fail', status: 1012 ,ticket:""};
      throw new HttpException('Something went wrong', 500);
    }
    return changePasswordResp;
  }

  //user registration
  @Post('signup')
  async signup(@Body() body: SignupReqDTO): Promise<ApiRespDTO<Object>> {
    const signupResp = await this.userService.createUser(body);
    return signupResp;
  }

  @Post('update-profile')
  @UseGuards(AccountIdGuard)
  async updateProfile(@Request() req: Object,@Body() body: UpdateProfileReqDTO): Promise<ApiRespDTO<Object>> {
    const updateProfileResp = await this.userService.updateUser(req["user"]["sub"],body);
    return updateProfileResp;
  }

  //access for sysyadmin only
  //clear cache
  @UseGuards(SysadminGuard)
  @Post('clear-cache')
  async clearCache(): Promise<ApiRespDTO<Object>> {
    const clearCacheResp = await this.userService.clearCache();
    return clearCacheResp;
  }
  //for testing only
  @UseGuards(SysadminGuard)
  @Get('get-cache')
  async getCache(): Promise<ApiRespDTO<Object>> {
    const clearCacheResp = await this.userService.getCacheKeys();
    return clearCacheResp;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('add-user-contact')
  async addUserContactForAccount(@Body() addUpdateUserContactForAccountReqDto: AddUpdateUserContactForAccountReqDto): Promise<ApiRespDTO<Object>>{
       const addUserContactForAccountResp = await this.userService.addUserContactForAccount(addUpdateUserContactForAccountReqDto)
       return addUserContactForAccountResp;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('fetch-user-contacts')
  async fetchUsersFromAccount(@Body() fetchUsersFromAccountReqDto: FetchUserContactsForAccountReqDto):Promise<ApiRespDTO<Object>>{
    try{
      const addUserFromAccountResp = await this.userService.fetchUserContactListForAccount(fetchUsersFromAccountReqDto)  
      return {
        success: true,
        status: 1000,
        message: 'Success',
        data: addUserFromAccountResp,
      };
    }catch (error) {
      return {
        success: false,
        status: 1053,
        message: 'Error while fetching the list',
        data: [],
      };
    }
   
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('edit-user-contact')
  async EditUserContactForAccount(@Body() addUpdateUserContactForAccountReqDto: AddUpdateUserContactForAccountReqDto): Promise<ApiRespDTO<Object>>{
    const editUserContactForAccountResp = await this.userService.editUserContactForAccount(addUpdateUserContactForAccountReqDto)  
    return editUserContactForAccountResp;
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Delete(':id/delete')
  async delteUser(@Query('accountId') accountId: string,@Param('id') id:string ): Promise<ApiRespDTO<Object>>{
    const deleteUserResp = await this.userService.deleteUser(id)  
    return deleteUserResp;
  }


}

