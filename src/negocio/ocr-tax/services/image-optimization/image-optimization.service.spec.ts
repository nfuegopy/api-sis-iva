import { Test, TestingModule } from '@nestjs/testing';
import { ImageOptimizationService } from './image-optimization.service';

describe('ImageOptimizationService', () => {
  let service: ImageOptimizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageOptimizationService],
    }).compile();

    service = module.get<ImageOptimizationService>(ImageOptimizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
