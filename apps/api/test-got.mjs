import { gotScraping } from 'got-scraping';

async function testStealthFetch() {
  const url = 'https://tabletki.ua/uk/Go-On-Nutrition-Protein-33/1040251/';

  try {
    console.log('🚀 Sending stealth request mimicking a real browser...');
    
    // gotScraping automatically generates perfect headers and spoofs the TLS fingerprint
    const response = await gotScraping({
      url: url,
      headerGeneratorOptions: {
        browsers: ['chrome', 'firefox'],
        operatingSystems: ['windows', 'macos'],
      }
    });

    console.log(`Status Code: ${response.statusCode}`);

    if (response.statusCode === 200) {
      console.log('✅ SUCCESS! We bypassed the Cloudflare bouncer.');
      console.log('--- First 200 characters of the HTML ---');
      console.log(response.body.substring(0, 200));
      console.log('----------------------------------------');
    } else {
      console.log('❌ Blocked. The server returned:', response.statusCode);
    }

  } catch (error) {
    console.error('Request failed. Details:', error.message);
  }
}

testStealthFetch();