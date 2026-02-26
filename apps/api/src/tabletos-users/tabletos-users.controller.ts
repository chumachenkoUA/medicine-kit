import { Controller, Get, Post, Query, Body, Patch, Param, Delete } from '@nestjs/common';
import { TabletosUsersService } from './tabletos-users.service';
import { CreateTabletosUserDto } from './dto/create-tabletos-user.dto';
import { UpdateTabletosUserDto } from './dto/update-tabletos-user.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller('tabletos-users')
export class TabletosUsersController {
  constructor(private readonly tabletosUsersService: TabletosUsersService) {}
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createTabletosUserDto: CreateTabletosUserDto) {
    return this.tabletosUsersService.create(createTabletosUserDto);
  }
  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() query: any) {
  return this.tabletosUsersService.findAll(query);
}
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tabletosUsersService.findOne(+id);
  }
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTabletosUserDto: UpdateTabletosUserDto) {
    return this.tabletosUsersService.update(+id, updateTabletosUserDto);
  }
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tabletosUsersService.remove(+id);
  }
}
