import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

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
        AuthService,
        ConfigService,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Generate RFQ Token
  it('Should return RFQ token', async () => {
    // Arrange
    const rfq_id = '1234567890';

    const response = {
      secret: 'mockSecret',
      expiresIn: 'mockExpiresIn',
    };

    mockJwtService.signAsync.mockReturnValueOnce(response);

    // Act

    const result = service.generateRFQToken(rfq_id);

    // Assert
    expect(result).toBeDefined();
  });

  // Generate payment info token

  it('Should return payment info token', async () => {
    // Arrange
    const request = {
      accountId: 'mockAccountId',
      orderNo: 'mockOrderNo',
    };

    const response = {
      secret: 'mockSecret',
      expiresIn: 'mockExpiresIn',
    };

    mockJwtService.signAsync.mockReturnValueOnce(response);

    // Act

    const result = service.generatePaymentInfoToken(
      request.accountId,
      request.orderNo,
    );

    // Assert

    expect(result).toBeDefined();
  });
});
