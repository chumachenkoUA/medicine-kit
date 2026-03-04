import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTabletosUserDto } from './dto/create-tabletos-user.dto';
import { UpdateTabletosUserDto } from './dto/update-tabletos-user.dto';
import { TabletosUsersService } from './tabletos-users.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string | number;
  };
};

@Controller('tabletos-users')
export class TabletosUsersController {
  constructor(private readonly tabletosUsersService: TabletosUsersService) {}

  private readUserId(request: AuthenticatedRequest): string | number {
    const sub = request.user?.sub;
    if (!sub) throw new UnauthorizedException('Користувач не авторизований.');
    return sub;
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateTabletosUserDto) {
    return this.tabletosUsersService.create(this.readUserId(request), dto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() request: AuthenticatedRequest, @Query() query: any) {
    return this.tabletosUsersService.findAll(this.readUserId(request), query);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.tabletosUsersService.findOne(this.readUserId(request), Number(id));
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateTabletosUserDto: UpdateTabletosUserDto,
  ) {
    return this.tabletosUsersService.update(
      this.readUserId(request),
      Number(id),
      updateTabletosUserDto,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.tabletosUsersService.remove(this.readUserId(request), Number(id));
  }
}
