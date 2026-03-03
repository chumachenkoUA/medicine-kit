import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { prisma } from '../lib/prisma';
import { generateEventsWithFlexibleHours } from '../lib/calendar/calendar.service';

@Injectable()
export class CoursesService {
  private normalizeId(value: string | number | bigint): bigint {
    return typeof value === 'bigint' ? value : BigInt(value);
  }

  async create(createCourseDto: CreateCourseDto) {
    return await prisma.courses.create({
      data: {
        Name_doctor: createCourseDto.nameDoctor,
        Period_courses: createCourseDto.period,
        Quantity_day: createCourseDto.qtyDay,
        Start_date: createCourseDto.startDate,
        Description: createCourseDto.description,
        users: {
          connect: { Id: this.normalizeId(createCourseDto.userId) },
        },
        tabletos: {
          connect: { Id: this.normalizeId(createCourseDto.tabletoId) },
        },
      },
    });
  }

  async findAll() {
    return await prisma.courses.findMany();
  }

  async findAllByUser(userId: string | number | bigint) {
    return await prisma.courses.findMany({
      where: { users_id: this.normalizeId(userId) },
      orderBy: { Start_date: 'desc' },
    });
  }

  async findOne(id: number) {
    return await prisma.courses.findUnique({
      where: { Id: id },
    });
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    const data: Record<string, unknown> = {};
    if (updateCourseDto.nameDoctor !== undefined) data.Name_doctor = updateCourseDto.nameDoctor;
    if (updateCourseDto.period !== undefined) data.Period_courses = updateCourseDto.period;
    if (updateCourseDto.qtyDay !== undefined) data.Quantity_day = updateCourseDto.qtyDay;
    if (updateCourseDto.startDate !== undefined) data.Start_date = updateCourseDto.startDate;
    if (updateCourseDto.description !== undefined) data.Description = updateCourseDto.description;
    if (updateCourseDto.tabletoId !== undefined) {
      data.tabletos = { connect: { Id: this.normalizeId(updateCourseDto.tabletoId) } };
    }
    if (updateCourseDto.userId !== undefined) {
      data.users = { connect: { Id: this.normalizeId(updateCourseDto.userId) } };
    }

    return await prisma.courses.update({
      where: { Id: id },
      data: {
        ...data,
      },
    });
  }

  async remove(id: number) {
    return await prisma.courses.delete({
      where: { Id: id },
    });
  }

  async getCalendarEventsByUser(userId: string | number | bigint) {
    const courses = await this.findAllByUser(userId);
    return courses.flatMap((course) => generateEventsWithFlexibleHours(course));
  }
}
