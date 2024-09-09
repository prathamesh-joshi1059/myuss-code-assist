import { Test, TestingModule } from "@nestjs/testing";
import { SfdcBaseService } from "src/backend/sfdc/services/sfdc-base/sfdc-base.service";
import { SfdcProjectService } from "src/backend/sfdc/services/sfdc-project/sfdc-project.service";
import { LoggerService } from "src/core/logger/logger.service";
import { TrackUserActionService } from "src/core/track-user-action/track-user-action-service";
import { ProjectService } from "./project.service";


// TODO add test case for fetchProject
describe('ProjectService', () => {
    let service: ProjectService;
    let mockLoggerService = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn()
    }
    let mocktrackUserActionService = {
      trackUserAction: jest.fn()
    }
    let mockSfdcProjectService ={
       fetchProjects: jest.fn(), 
    }
    let mockSfdcBaseService = {
        getSObjectByIds: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
          providers: [ProjectService,
            {
              provide: SfdcProjectService,
              useValue: mockSfdcProjectService
            },
            {
              provide: SfdcBaseService,
              useValue: mockSfdcBaseService
            },
            {
              provide: TrackUserActionService,
              useValue: mocktrackUserActionService
            },
            {
              provide: LoggerService,
              useValue: mockLoggerService
            }
          ],
        }).compile();
        service = module.get<ProjectService>(ProjectService);
      });
});