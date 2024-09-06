import { SysadminGuard } from './sysadmin.guard';

describe('SidetradeGuard', () => {
  it('should be defined', () => {
    expect(new SysadminGuard()).toBeDefined();
  });
});
