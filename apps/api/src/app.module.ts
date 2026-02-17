import { Module } from '@nestjs/common';
import { TabletosModule } from './tabletos/tabletos.module'; // Імпортуємо ваші таблетки

@Module({
  imports: [
      TabletosModule, // <--- Підключаємо вашу функціональність сюди
      // Коли з'являться юзери, додасте: UsersModule
  ],
  controllers: [], // <--- Тут пусто, бо головний контролер нам не треба
  providers: [],   // <--- Тут пусто, бо головний сервіс нам не треба
})
export class AppModule {}