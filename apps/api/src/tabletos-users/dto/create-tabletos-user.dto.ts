import { IsInt, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateTabletosUserDto {
  // --- Твої існуючі поля (для прикладу) ---
  @IsInt()
  @IsNotEmpty()
  count: number;

  @IsDateString()
  expirationDate: string;

  @IsDateString()
  createDate: string;
  // --- 👇 НОВІ ПОЛЯ (ДЛЯ ЗВ'ЯЗКІВ) 👇 ---
  
  @IsInt()
  @IsNotEmpty()
  userId: number;    // Сюди фронтенд передасть ID юзера (наприклад, 1)

  @IsInt()
  @IsNotEmpty()
  tabletoId: number; // Сюди фронтенд передасть ID таблетки (наприклад, 5)
}