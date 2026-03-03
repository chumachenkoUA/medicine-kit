import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string | number;
  };
};

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  private readUserId(request: AuthenticatedRequest): string | number {
    const sub = request.user?.sub;
    if (!sub) throw new UnauthorizedException('Користувач не авторизований.');
    return sub;
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }
  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.coursesService.findAllByUser(this.readUserId(request));
  }

  @UseGuards(AuthGuard)
  @Get('calendar')
  getCalendar(@Req() request: AuthenticatedRequest) {
    return this.coursesService.getCalendarEventsByUser(this.readUserId(request));
  }
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(+id);
  }
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(+id, updateCourseDto);
  }
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coursesService.remove(+id);
  }
}
