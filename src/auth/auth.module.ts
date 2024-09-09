import { Module } from '@nestjs/common';
import { CustomAuthGuard } from './auth.guard';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ManagementAPIStrategy } from './strategies/management-api.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_PRIVATE_KEY');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN');
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  providers: [
    ConfigService,
    CustomAuthGuard,
    JwtStrategy,
    AuthService,
    ManagementAPIStrategy,
  ],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}