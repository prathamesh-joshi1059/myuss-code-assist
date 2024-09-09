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
import { ApiRespDTO } from '../../../common/dto/api-resp.dto';
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
  async getMe(@Request() req: { user: { sub: string } }): Promise<ApiRespDTO<UserDetails | object>> {
    return await this.userService.fetchUsersDetails(req.user.sub);
  }

  @Post('me/request-email-verification')
  async requestEmailVerification(@Request() req: { user: { sub: string } }): Promise<ApiRespDTO<object>> {
    return await this.userService.requestEmailVerification(req.user.sub);
  }

  //fetch user profile details
  @Post('fetch-user')
  async fetchUsersDetails(@Request() req: { user: { sub: string } }, @Body() body: FetchUserReqDTO): Promise<ApiRespDTO<object | UserDetails>> {
    if (req.user.sub !== body.Id) {
      throw new HttpException('Unauthorized', 401);
    }
    return await this.userService.fetchUsersDetails(body.Id);
  }

  //change password create link
  @Post('change-password')
  async changePassword(@Request() req: { user: { sub: string } }, @Body() changePasswordDto: ChangePasswordReqDto): Promise<ChangePasswordRespDto> {
    const hasAccess = await this.userService.hasAccessToAccount(req.user.sub, { email: changePasswordDto.email }, 'email');
    const changePasswordResp = new ChangePasswordRespDto();

    if (!hasAccess) {
      throw new HttpException('Unauthorized', 401);
    }

    try {
      const resp = await this.auth0Service.changePassword(changePasswordDto.email);
      return resp.ticket
        ? { success: true, message: 'Success', status: 1000, ticket: resp.ticket }
        : { success: false, message: 'Fail', status: 1012, ticket: '' };
    } catch (err) {
      this.logger.error(err);
      throw new HttpException('Something went wrong', 500);
    }
  }

  //user registration
  @Post('signup')
  async signup(@Body() body: SignupReqDTO): Promise<ApiRespDTO<Object>> {
    return await this.userService.createUser(body);
  }

  @Post('update-profile')
  @UseGuards(AccountIdGuard)
  async updateProfile(@Request() req: { user: { sub: string } }, @Body() body: UpdateProfileReqDTO): Promise<ApiRespDTO<Object>> {
    return await this.userService.updateUser(req.user.sub, body);
  }

  //access for sysadmin only
  //clear cache
  @UseGuards(SysadminGuard)
  @Post('clear-cache')
  async clearCache(): Promise<ApiRespDTO<Object>> {
    return await this.userService.clearCache();
  }

  //for testing only
  @UseGuards(SysadminGuard)
  @Get('get-cache')
  async getCache(): Promise<ApiRespDTO<Object>> {
    return await this.userService.getCacheKeys();
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('add-user-contact')
  async addUserContactForAccount(@Body() addUpdateUserContactForAccountReqDto: AddUpdateUserContactForAccountReqDto): Promise<ApiRespDTO<Object>> {
    return await this.userService.addUserContactForAccount(addUpdateUserContactForAccountReqDto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('fetch-user-contacts')
  async fetchUsersFromAccount(@Body() fetchUsersFromAccountReqDto: FetchUserContactsForAccountReqDto): Promise<ApiRespDTO<Object>> {
    try {
      const addUserFromAccountResp = await this.userService.fetchUserContactListForAccount(fetchUsersFromAccountReqDto);
      return { success: true, status: 1000, message: 'Success', data: addUserFromAccountResp };
    } catch (error) {
      return { success: false, status: 1053, message: 'Error while fetching the list', data: [] };
    }
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Post('edit-user-contact')
  async editUserContactForAccount(@Body() addUpdateUserContactForAccountReqDto: AddUpdateUserContactForAccountReqDto): Promise<ApiRespDTO<Object>> {
    return await this.userService.editUserContactForAccount(addUpdateUserContactForAccountReqDto);
  }

  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @Delete(':id/delete')
  async deleteUser(@Query('accountId') accountId: string, @Param('id') id: string): Promise<ApiRespDTO<Object>> {
    return await this.userService.deleteUser(id);
  }
}