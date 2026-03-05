import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { prisma } from '../lib/prisma';

type UserIdLike = string | number | bigint;

@Injectable()
export class UsersService {
  private normalizeId(value: UserIdLike): bigint {
    return typeof value === 'bigint' ? value : BigInt(value);
  }

  async create(data: CreateUserDto) {
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

  async findOneById(id: UserIdLike | undefined) {
    if (id == null) {
      throw new NotFoundException('Користувача не знайдено.');
    }

    const user = await prisma.users.findUnique({
      where: { Id: this.normalizeId(id) },
      select: {
        Id: true,
        Name: true,
        Surname: true,
        Username: true,
        Email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено.');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await({where: { id },
    data: {
        Name: updateUserDto.name,
        Surname: updateUserDto.surname,
        Username: updateUserDto.username,
        Email: updateUserDto.email,
        Password: updateUserDto.password,
  }});
  }

  async remove(id: number) {
    return await prisma.users.delete
    ({where: {Id:id},}) ;
  }
}
