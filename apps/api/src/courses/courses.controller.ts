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
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpsertDoseLogDto } from './dto/upsert-dose-log.dto';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string | number;
  };
};

interface DateRangeQuery {
  from?: string;
  to?: string;
}

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
  create(@Req() request: AuthenticatedRequest, @Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.createForUser(this.readUserId(request), createCourseDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.coursesService.findAllByUser(this.readUserId(request));
  }

  @UseGuards(AuthGuard)
  @Get('calendar')
  getCalendar(@Req() request: AuthenticatedRequest, @Query() query: DateRangeQuery) {
    return this.coursesService.getCalendarEventsByUser(this.readUserId(request), query);
  }

  @UseGuards(AuthGuard)
  @Get('stock-warnings')
  getStockWarnings(@Req() request: AuthenticatedRequest) {
    return this.coursesService.getStockWarningsByUser(this.readUserId(request));
  }

  @UseGuards(AuthGuard)
  @Post(':id/dose-log')
  upsertDoseLog(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() payload: UpsertDoseLogDto,
  ) {
    return this.coursesService.upsertDoseLogForUser(this.readUserId(request), Number(id), payload);
  }

  @UseGuards(AuthGuard)
  @Get(':id/progress')
  getProgress(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query() query: DateRangeQuery,
  ) {
    return this.coursesService.getCourseProgressByUser(
      this.readUserId(request),
      Number(id),
      query,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.coursesService.findOneByUser(this.readUserId(request), Number(id));
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.updateByUser(this.readUserId(request), Number(id), updateCourseDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.coursesService.removeByUser(this.readUserId(request), Number(id));
  }
}
