import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { prisma } from '../lib/prisma';

@Injectable()
export class UsersService {
  async create(data: any) {
    return prisma.users.create({ data:{
      Name: data.name,         // Було name, стало Name
        Surname: data.surname,   // Було surname, стало Surname
        Username: data.username, // Було username, стало Username
        Email: data.email,       // <--- Ось тут була помилка
        Password: data.password,
    } });
  }

  async findAll() {
    return await prisma.users.findMany();
  }

  async findOne(Email: string) {
    return prisma.users.findUnique({ where: { Email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await({where: { id },
    data: updateUserDto
  });
  }

  async remove(id: number) {
    return await ({where: {Id:id},}) ;
  }
}
