import { IsString, IsInt, IsOptional, IsNotEmpty, IsArray, IsIn } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  nameDoctor: string;

  @IsInt()
  period: number;

  @IsInt()
  qtyDay: number;
  
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['planned', 'active', 'completed', 'paused'])
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  doseTimes?: string[];
  
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsNotEmpty()
  tabletoId: number;
}
