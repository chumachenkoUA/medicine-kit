import { Injectable } from '@nestjs/common';
import { prisma } from '../lib/prisma';
import { CreateTabletoDto } from './dto/create-tableto.dto';
import { UpdateTabletoDto } from './dto/update-tableto.dto';
import { ParserService } from '../lib/parser/parser.services';

@Injectable()
export class TabletosService {
  constructor(private readonly parserService: ParserService) {}

  async parseLinkForForm(url: string) {
    return await this.parserService.parsePage(url);
  }

  async create(createTabletoDto: CreateTabletoDto) {
    return await prisma.tabletos.create({
      data: {
        Name: createTabletoDto.name,
        Description: createTabletoDto.description,
        Quantity: createTabletoDto.quantity,
        Effects: createTabletoDto.effects,
        Format: createTabletoDto.format,
        Link: createTabletoDto.link,
        Photo: createTabletoDto.photo,
        Rate: createTabletoDto.rate,
      },
    });
  }

  async findAll() {
    return await prisma.tabletos.findMany();
  }

  async findOne(id: number) {
    return await prisma.tabletos.findUnique({
      where:{Id:id},
    });
  }

  async update(id: number, updateTabletoDto: UpdateTabletoDto) {
    return await prisma.tabletos.update({
      where:{Id:id},
      data: {
        Name: updateTabletoDto.name,
        Description: updateTabletoDto.description,
        Format: updateTabletoDto.format,
      }
    });
  }

  async remove(id: number) {
    return await prisma.tabletos.delete({
      where: {Id:id},
    });
  }
}
