import { Module } from '@nestjs/common';
import { TabletosService } from './tabletos.service';
import { TabletosController } from './tabletos.controller';
import {ParserService} from '../lib/parser/parser.services'
@Module({
  controllers: [TabletosController],
  providers: [TabletosService, ParserService],
})
export class TabletosModule {}
