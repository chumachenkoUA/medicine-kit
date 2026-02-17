import { Module } from '@nestjs/common';
import { TabletosService } from './tabletos.service';
import { TabletosController } from './tabletos.controller';

@Module({
  controllers: [TabletosController],
  providers: [TabletosService],
})
export class TabletosModule {}
