import { defineConfig } from '@prisma/config'; // <--- ТУТ БУЛА ПОМИЛКА (треба @)
import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma', // Це вказує шлях, щоб не писати --schema вручну
  
  // migrations: { ... } // Цей блок поки можна прибрати, він необов'язковий зараз
  
  datasource: {
    // Краще використовувати process.env напряму, це надійніше
    url: process.env.DATABASE_URL, 
  },
});