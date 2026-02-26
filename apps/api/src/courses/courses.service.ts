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
  Start_date: createCourseDto.startDate,
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
    return await  prisma.courses.findMany();
  }

  async findOne(id: number) {
    return await prisma.courses.findUnique({
      where:{Id:id},
    });
  }

  async update(id: number, updateCourseDto: UpdateCourseDto) {
    return await({
      where:{Id:id},
      data: {
        // Якщо в DTO назви з маленької, а в БД з великої — мапимо їх тут
        Name_doctor: updateCourseDto.nameDoctor,
        Description: updateCourseDto.description,
        // Додай інші поля відповідно до твоєї схеми
      },
    });
  }

  async remove(id: number) {
    return await prisma.courses.delete({
      where:{Id:id},
    });
  }
}
