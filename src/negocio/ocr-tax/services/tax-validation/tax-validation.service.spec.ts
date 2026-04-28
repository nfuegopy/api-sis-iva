import { Test, TestingModule } from '@nestjs/testing';
import { TaxValidationService } from './tax-validation.service';

describe('TaxValidationService', () => {
  let service: TaxValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxValidationService],
    }).compile();

    service = module.get<TaxValidationService>(TaxValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
