import { Controller, Get, Post, Body, HttpCode, HttpStatus, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TabletosService } from './tabletos.service';
import { CreateTabletoDto } from './dto/create-tableto.dto';
import { UpdateTabletoDto } from './dto/update-tableto.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

export class ParseLinkDto {
  url: string;
}

@Controller('tabletos')
export class TabletosController {
  constructor(private readonly tabletosService: TabletosService) {}

  @Post('parse') // Маршрут буде: POST http://localhost:3000/api/tabletos/parse
  @HttpCode(HttpStatus.OK) // Ставимо статус 200 OK (бо 201 Created використовується, коли ми щось зберігаємо в БД)
  async parseUrl(@Body() body: ParseLinkDto) {
    // Передаємо посилання з тіла запиту у твій сервіс
    return await this.tabletosService.parseLinkForForm(body.url);
  }
  
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tabletosService.findOne(id);
  }
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTabletoDto: UpdateTabletoDto) {
    return this.tabletosService.update(id, updateTabletoDto);
  }
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tabletosService.remove(id);
  }
}
