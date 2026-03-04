import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UpsertDoseLogDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  time: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['taken', 'missed', 'skipped'])
  state: 'taken' | 'missed' | 'skipped';

  @IsOptional()
  @IsInt()
  @Min(1)
  packageId?: number;
}
