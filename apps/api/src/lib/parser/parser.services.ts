import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);

  async parsePage(url: string) {
    try {
      this.logger.log(`Starting stealth parse for: ${url}`);

      // 1. Dynamically import got-scraping to avoid NestJS ESM/CommonJS conflicts
      const gotScrapingModule = await eval(`import('got-scraping')`);
      const gotScraping = gotScrapingModule.gotScraping;

      // 2. Fetch the page mimicking a real browser's TLS fingerprint
      const response = await gotScraping({
        url: url,
        headerGeneratorOptions: {
          browsers: ['chrome', 'firefox'],
          operatingSystems: ['windows', 'macos'],
        },
      });

      if (response.statusCode !== 200) {
        throw new Error(`Cloudflare or server blocked the request. Status: ${response.statusCode}`);
      }

      // 3. Load the raw HTML into Cheerio
      const $ = cheerio.load(response.body);

      // 4. Extract data using our optimized selectors
      const title = $('h1').first().text().trim() 
        || $('meta[property="og:title"]').attr('content')?.trim() 
        || $('title').text().trim();

      const description = $('meta[name="description"]').attr('content')?.trim() 
        || $('meta[property="og:description"]').attr('content')?.trim() 
        || '';

      const photo = $('meta[property="og:image"]').attr('content')?.trim() 
        || $('div[class*="product"] img').first().attr('src')
        || $('img').first().attr('src') 
        || '';

      this.logger.log('Successfully parsed data!');

      // 5. Return the cleanly formatted object matching your DTO
      return {
        link: url,
        name: title,
        description: description,
        photo: photo,
      };

    } catch (error) {
      this.logger.error(`Failed to parse URL: ${url}. Details: ${error.message}`);
      throw new BadRequestException('Could not load data from the website. Check the link or the site might be protected.');
    }
  }
}