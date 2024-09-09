import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { Auth0MyUSSAPIService } from '../../../backend/auth0/services/auth0-myuss-api/auth0-myuss-api.service';
import { HttpService } from '@nestjs/axios';
const mockHttpService = {
  
}
describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers:[Auth0MyUSSAPIService,
      {
        provide: HttpService,
        useValue: mockHttpService,
      }
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
