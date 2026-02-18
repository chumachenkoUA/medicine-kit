import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true, // Щоб працювало всюди
      secret: 'SECRET_KEY_123', // У реальному проекті це має бути в .env файлі!
      signOptions: { expiresIn: '1d' }, // Токен живе 1 день
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}