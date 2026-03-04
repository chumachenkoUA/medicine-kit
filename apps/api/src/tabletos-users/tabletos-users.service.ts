import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../lib/prisma';
import { CreateTabletosUserDto } from './dto/create-tabletos-user.dto';
import { UpdateTabletosUserDto } from './dto/update-tabletos-user.dto';

type UserIdLike = string | number | bigint;

@Injectable()
export class TabletosUsersService {
  private normalizeId(value: UserIdLike): bigint {
    return typeof value === 'bigint' ? value : BigInt(value);
  }

  private serializeBigInt<T>(data: T): T {
    return JSON.parse(
      JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    ) as T;
  }

  private async findOwnedRecordOrThrow(userId: UserIdLike, id: number) {
    const record = await prisma.tabletos_user.findFirst({
      where: {
        Id: id,
        users_id: this.normalizeId(userId),
      },
      include: { tabletos: true },
    });

    if (!record) {
      throw new NotFoundException('Упаковку не знайдено.');
    }

    return record;
  }

  async create(userId: UserIdLike, createTabletosUserDto: CreateTabletosUserDto) {
    const created = await prisma.tabletos_user.create({
      data: {
        Count: createTabletosUserDto.count,
        Expiration_date: createTabletosUserDto.expirationDate,
        Create_date: createTabletosUserDto.createDate,
        users: {
          connect: { Id: this.normalizeId(userId) },
        },
        tabletos: {
          connect: { Id: this.normalizeId(createTabletosUserDto.tabletoId) },
        },
      },
      include: { tabletos: true },
    });

    return this.serializeBigInt(created);
  }

  async findAll(
    userId: UserIdLike,
    query: {
      search?: string;
      effect?: string;
      sort?: string;
      showExpired?: string;
    },
  ) {
    const { search, effect, sort, showExpired } = query;

    const whereCondition: any = {
      users_id: this.normalizeId(userId),
    };

    if (search || effect) {
      whereCondition.tabletos = {
        ...(search && { Name: { contains: search, mode: 'insensitive' } }),
        ...(effect && { Effects: { contains: effect, mode: 'insensitive' } }),
      };
    }

    if (showExpired === 'true') {
      whereCondition.Expiration_date = { lt: new Date() };
    }

    let orderBy: any = { Id: 'desc' };
    if (sort === 'name_asc') orderBy = { tabletos: { Name: 'asc' } };
    if (sort === 'name_desc') orderBy = { tabletos: { Name: 'desc' } };
    if (sort === 'date_asc') orderBy = { Expiration_date: 'asc' };
    if (sort === 'count_asc') orderBy = { Count: 'asc' };

    const result = await prisma.tabletos_user.findMany({
      where: whereCondition,
      orderBy,
      include: {
        tabletos: true,
      },
    });

    return this.serializeBigInt(result);
  }

  async findOne(userId: UserIdLike, id: number) {
    const result = await this.findOwnedRecordOrThrow(userId, id);
    return this.serializeBigInt(result);
  }

  async update(userId: UserIdLike, id: number, updateTabletosUserDto: UpdateTabletosUserDto) {
    await this.findOwnedRecordOrThrow(userId, id);

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

  async remove(userId: UserIdLike, id: number) {
    await this.findOwnedRecordOrThrow(userId, id);

    const result = await prisma.tabletos_user.delete({
      where: { Id: id },
    });

    return this.serializeBigInt(result);
  }
}
