import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TabletosService } from './tabletos.service';
import { CreateTabletoDto } from './dto/create-tableto.dto';
import { UpdateTabletoDto } from './dto/update-tableto.dto';

@Controller('tabletos')
export class TabletosController {
  constructor(private readonly tabletosService: TabletosService) {}

  @Post()
  create(@Body() createTabletoDto: CreateTabletoDto) {
    return this.tabletosService.create(createTabletoDto);
  }

  @Get()
  findAll() {
    return this.tabletosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tabletosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTabletoDto: UpdateTabletoDto) {
    return this.tabletosService.update(+id, updateTabletoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tabletosService.remove(+id);
  }
}
