import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodAuthGuard } from './payment-method.guard';
import { LoggerService } from '../../../core/logger/logger.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

describe('PaymentMethodAuthGuard', () => {
  let guard: PaymentMethodAuthGuard;

  // let mockExecutionContext = {
  //   getClass: jest.fn().mockImplementation(() => {
  //     return 'mockClass';
  //   }),
  //   getHandler: jest.fn().mockImplementation(() => {
  //     return 'mockHandler';
  //   }),
  // };

 

  let mockJwtService = {
    signAsync: jest.fn().mockImplementation(() => {
      return 'mockToken';
    }),
    sign: jest.fn().mockImplementation(() => {
      return 'mockToken';
    }),
    verify: jest.fn().mockImplementation(() => {
      return 'mockToken';
    }),
    verifyAsync: jest.fn().mockImplementation(() => {
      return 'mockToken';
    }),
    decode: jest.fn().mockImplementation(() => {
      return 'mockToken';
    }),
  };



  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodAuthGuard,
        ConfigService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        
      ],
    }).compile();

    guard = module.get<PaymentMethodAuthGuard>(PaymentMethodAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // canActivate
  it('Should return missing token message', async () => {

    // Arrange
    const mockRequest = {
      body: {
        orderUpdateJWT: 'mockOrderUpdateJWT',
      }
    };

    const token = mockRequest.body.orderUpdateJWT;

    if(token == undefined){
      throw new UnauthorizedException('Missing token');
    }

    const payload = 'mockPayload';
    
    const tokenRequest = {
      token: 'mockToken',
      secret: 'mockSecret',

    }
    
   const mockExecutionContext = {
      switchToHttp: jest.fn().mockImplementation(() => {
        return {
          getRequest: jest.fn().mockImplementation(() => {
            return mockRequest;
          }),
        };
      }),
    };

    mockJwtService.verifyAsync.mockReturnValueOnce(payload);

    // Act
  //  const result = guard.canActivate(mockExecutionContext as ExecutionContext);
   



   
      

  });

});
