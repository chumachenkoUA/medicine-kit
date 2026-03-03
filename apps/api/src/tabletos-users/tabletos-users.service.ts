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
  
  async findAll(query: { 
    search?: string, 
    effect?: string, 
    sort?: string, 
    showExpired?: string 
  }) {
    const { search, effect, sort, showExpired } = query;

    // 1. Формуємо об'єкт фільтрації (Where)
    const whereCondition: any = {
      tabletos: {
        ...(search && { Name: { contains: search, mode: 'insensitive' } }),
        ...(effect && { Effects: { contains: effect, mode: 'insensitive' } }),
      }
    };

    // Додатково: фільтр для протермінованих ліків
    if (showExpired === 'true') {
      whereCondition.Expiration_date = { lt: new Date() };
    }

    // 2. Формуємо об'єкт сортування (OrderBy)
    let orderBy: any = { Id: 'desc' }; // за замовчуванням нові зверху

    if (sort === 'name_asc')  orderBy = { tabletos: { Name: 'asc' } };
    if (sort === 'name_desc') orderBy = { tabletos: { Name: 'desc' } };
    if (sort === 'date_asc')  orderBy = { Expiration_date: 'asc' }; // швидка смерть
    if (sort === 'count_asc') orderBy = { Count: 'asc' };           // що закінчується

    // 3. Запит до БД
    const result = await prisma.tabletos_user.findMany({
      where: whereCondition,
      orderBy: orderBy,
      include: {
        tabletos: true,
      },
    });

    // 4. Обробка BigInt (важливо!)
    return this.serializeBigInt(result);
  }

  async findOne(id: number) {
    const result = await prisma.tabletos_user.findUnique({
      where: { Id: id },
      include: { tabletos: true },
    });
    return this.serializeBigInt(result);
  }

  // Допоміжна функція для конвертації BigInt у String
  private serializeBigInt(data: any) {
    return JSON.parse(
      JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  }

  async update(id: number, updateTabletosUserDto: UpdateTabletosUserDto) {
    const result = await prisma.tabletos_user.update({
      where: { Id: id },
      data: {
        ...(typeof updateTabletosUserDto.count === 'number'
          ? { Count: updateTabletosUserDto.count }
          : {}),
        ...(typeof updateTabletosUserDto.expirationDate === 'string'
          ? { Expiration_date: updateTabletosUserDto.expirationDate }
          : {}),
      },
      include: { tabletos: true },
    });

    return this.serializeBigInt(result);
  }

  async remove(id: number) {
    return await prisma.tabletos_user.delete({
      where:{Id:id},
    });
  }
}
