import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  // 1. Реєстрація (Хешуємо пароль)
  async register(name:string, surname:string, username:string, email: string, pass: string) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    return this.usersService.create({ name, surname, username, email, password: hashedPassword });
  }

  // 2. Логін (Перевіряємо пароль і видаємо токен)
  async login( email: string, pass: string) {
    const user = await this.usersService.findOne(email);
    
    if (!user) throw new UnauthorizedException('Невірний email');
    
    const isMatch = await bcrypt.compare(pass, user.Password);
    if (!isMatch) throw new UnauthorizedException('Невірний пароль');

    // Якщо все ок, генеруємо токен
    const payload = { sub: user.Id, email: user.Email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}