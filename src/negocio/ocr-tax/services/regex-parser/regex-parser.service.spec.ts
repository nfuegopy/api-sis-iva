import { Test, TestingModule } from '@nestjs/testing';
import { RegexParserService } from './regex-parser.service';

describe('RegexParserService', () => {
  let service: RegexParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegexParserService],
    }).compile();

    service = module.get<RegexParserService>(RegexParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
