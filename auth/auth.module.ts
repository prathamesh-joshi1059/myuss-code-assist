import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { CustomAuthGuard } from './auth.guard';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ManagementAPIStrategy } from './strategies/management-api.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_PRIVATE_KEY'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [
    ConfigService,
    CustomAuthGuard,
    JwtStrategy,
    AuthService,
    ManagementAPIStrategy,
  ],
  exports: [
    PassportModule,
    AuthService,
  ],
})
export class AuthModule {}