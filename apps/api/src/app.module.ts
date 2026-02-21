import { Module } from '@nestjs/common';
import { TabletosModule } from './tabletos/tabletos.module'; // Імпортуємо ваші таблетки
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { TabletosUsersModule } from './tabletos-users/tabletos-users.module';
@Module({
  imports: [
      TabletosModule,
      UsersModule,
      AuthModule,
      TabletosUsersModule,
       CoursesModule,// <--- Підключаємо вашу функціональність сюди
      // Коли з'являться юзери, додасте: UsersModule
  ],
  controllers: [], // <--- Тут пусто, бо головний контролер нам не треба
  providers: [],   // <--- Тут пусто, бо головний сервіс нам не треба
})
export class AppModule {}