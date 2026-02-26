import { IsString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCourseDto {
  // --- Твої існуючі поля (для прикладу) ---
  @IsString()
  @IsNotEmpty()
  nameDoctor: string;

  @IsInt()
  period: number;

  @IsInt()
  qtyDay: number;
  
  @IsString()
  @IsNotEmpty()
  startDate: string; // Використовуємо string, бо це дата у форматі ISO (наприклад, "2024-06-01")

  @IsString()
  @IsOptional()
  description?: string;

  // --- 👇 НОВІ ПОЛЯ (ДЛЯ ЗВ'ЯЗКІВ) 👇 ---
  
  @IsInt()
  @IsNotEmpty()
  userId: number;    // Сюди фронтенд передасть ID юзера (наприклад, 1)

  @IsInt()
  @IsNotEmpty()
  tabletoId: number; // Сюди фронтенд передасть ID таблетки (наприклад, 5)
}