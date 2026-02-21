import { Injectable } from '@nestjs/common';
import { CreateTabletosUserDto } from './dto/create-tabletos-user.dto';
import { UpdateTabletosUserDto } from './dto/update-tabletos-user.dto';
import { prisma } from '../lib/prisma';

@Injectable()
export class TabletosUsersService {
  async create(createTabletosUserDto: CreateTabletosUserDto) {
    return await prisma.tabletos_user.create({data:{
      Count: createTabletosUserDto.count,
      Expiration_date: createTabletosUserDto.expirationDate,
      Create_date: createTabletosUserDto.createDate,
    users: {
      connect: { Id: createTabletosUserDto.userId } // Тобі треба передати userId з фронту
    },
    tabletos: {
      connect: { Id: createTabletosUserDto.tabletoId } // Тобі треба передати tabletoId
    }
      }});
  }

  async findAll() {
    return await prisma.tabletos_user.findMany({include: {
      tabletos: true,
    }});
  }

  async findOne(id: number) {
    return await prisma.tabletos_user.findUnique({
      where:{Id:id},
      include: { tabletos: true },
      
    });
  }

  async update(id: number, updateTabletosUserDto: UpdateTabletosUserDto) {
    return await({
      where:{Id:id},
      data: {
        Count: updateTabletosUserDto.count,
        Expiration_date: updateTabletosUserDto.expirationDate,
  }}) ;
  }

  async remove(id: number) {
    return await prisma.tabletos_user.delete({
      where:{Id:id},
    });
  }
}
