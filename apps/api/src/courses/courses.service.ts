import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { prisma } from '../lib/prisma';

@Injectable()
export class CoursesService {
  async create(createCourseDto: CreateCourseDto) {
    return await  prisma.courses.create({data:{
  Name_doctor: createCourseDto.nameDoctor,
  Period_courses: createCourseDto.period,
  Quantity_day: createCourseDto.qtyDay,
  Quantity_week: createCourseDto.qtyWeek,
  Description: createCourseDto.description,
  users: {
    connect: { Id: createCourseDto.userId } // Тобі треба передати userId з фронту
  },
  tabletos: {
    connect: { Id: createCourseDto.tabletoId } // Тобі треба передати tabletoId
  }
    }});
  }

  async findAll() {
    return await  prisma.courses.findMany;
  }

  async findOne(id: number) {
    return await prisma.courses.findUnique({
      where:{Id:id},
    });
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    return await({
      where:{Id:id},
      data: updateCourseDto,
    });
  }

  async remove(id: number) {
    return await ({
      where:{Id:id},
    });
  }
}
