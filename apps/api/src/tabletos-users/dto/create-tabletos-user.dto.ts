import { IsDateString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTabletosUserDto {
  @IsInt()
  @IsNotEmpty()
  count: number;

  @IsDateString()
  expirationDate: string;

  @IsDateString()
  createDate: string;

  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsNotEmpty()
  tabletoId: number;
}
