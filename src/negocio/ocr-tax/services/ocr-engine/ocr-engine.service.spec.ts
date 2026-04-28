import { Test, TestingModule } from '@nestjs/testing';
import { OcrEngineService } from './ocr-engine.service';

describe('OcrEngineService', () => {
  let service: OcrEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrEngineService],
    }).compile();

    service = module.get<OcrEngineService>(OcrEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
