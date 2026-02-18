import { Test, TestingModule } from '@nestjs/testing';
import { TabletosService } from './tabletos.service';

describe('TabletosService', () => {
  let service: TabletosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TabletosService],
    }).compile();

    service = module.get<TabletosService>(TabletosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
