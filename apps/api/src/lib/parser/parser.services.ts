import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ParserService {
  // Додаємо логер NestJS для зручного відстеження помилок у консолі
  private readonly logger = new Logger(ParserService.name);

  async parsePage(url: string) {
    try {
      // 1. Відправляємо запит, маскуючись під звичайний браузер Google Chrome
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      const $ = cheerio.load(response.data);

      // 2. НАЗВА: 
      // На tabletki.ua головна назва лежить у тезі <h1>. 
      // Як запасний варіант беремо og:title або звичайний <title>.
      const title = $('h1').first().text().trim() 
        || $('meta[property="og:title"]').attr('content')?.trim() 
        || $('title').text().trim();

      // 3. ОПИС: 
      // Мета-тег description на таких сайтах зазвичай містить коротку вижимку 
      // (наприклад: "Купити Ношпа таблетки... Діюча речовина: дротаверин").
      const description = $('meta[name="description"]').attr('content')?.trim() 
        || $('meta[property="og:description"]').attr('content')?.trim() 
        || '';

      // 4. ФОТО: 
      // og:image - це найвищої якості картинка, яку сайт віддає для соцмереж.
      // Якщо її немає, шукаємо перше зображення всередині блоку товару.
      const photo = $('meta[property="og:image"]').attr('content')?.trim() 
        || $('div[class*="product"] img').first().attr('src') // Шукає img в будь-якому div, клас якого містить слово "product"
        || $('img').first().attr('src') 
        || '';

      // Повертаємо об'єкт для фронтенду
      return {
        link: url,
        name: title,
        description: description,
        photo: photo,
      };

    } catch (error) {
      // Логуємо реальну помилку в консоль бекенду (наприклад, статус 403 або 404)
      this.logger.error(`Помилка парсингу URL: ${url}. Деталі: ${error.message}`);
      
      // Віддаємо фронтенду зрозумілу помилку
      throw new BadRequestException('Не вдалося завантажити дані з сайту. Перевірте правильність посилання.');
    }
  }
}