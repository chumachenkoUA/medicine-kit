import { Test, TestingModule } from '@nestjs/testing';
import { TabletosController } from './tabletos.controller';
import { TabletosService } from './tabletos.service';

describe('TabletosController', () => {
  let controller: TabletosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TabletosController],
      providers: [TabletosService],
    }).compile();

    controller = module.get<TabletosController>(TabletosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
