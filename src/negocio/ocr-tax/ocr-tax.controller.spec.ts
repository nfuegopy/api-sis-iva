import { Test, TestingModule } from '@nestjs/testing';
import { OcrTaxController } from './ocr-tax.controller';

describe('OcrTaxController', () => {
  let controller: OcrTaxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OcrTaxController],
    }).compile();

    controller = module.get<OcrTaxController>(OcrTaxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
