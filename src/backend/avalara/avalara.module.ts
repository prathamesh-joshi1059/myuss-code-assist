import { Module } from '@nestjs/common';
import { AvalaraCalculateTaxService } from './services/calculate-tax/calculate-tax.service';
import { CoreModule } from '../../core/core.module';

@Module({
  imports: [CoreModule],
  providers: [AvalaraCalculateTaxService],
  exports: [AvalaraCalculateTaxService],
})
export class AvalaraModule {}