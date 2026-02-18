import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TabletosService } from './tabletos.service';
import { CreateTabletoDto } from './dto/create-tableto.dto';
import { UpdateTabletoDto } from './dto/update-tableto.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller('tabletos')
export class TabletosController {
  constructor(private readonly tabletosService: TabletosService) {}

  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTabletoDto: UpdateTabletoDto) {
    return this.tabletosService.update(+id, updateTabletoDto);
  }
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tabletosService.remove(+id);
  }
}
