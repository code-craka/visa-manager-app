const puppeteer = require('puppeteer');

let browser;
let page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

beforeEach(async () => {
  if (page) {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  }
});

global.browser = browser;
global.page = page;