import { SfdcGuard } from './sfdc.guard';

describe('SidetradeGuard', () => {
  it('should be defined', () => {
    expect(new SfdcGuard()).toBeDefined();
  });
});
