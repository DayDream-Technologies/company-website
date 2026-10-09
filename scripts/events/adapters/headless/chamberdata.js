/**
 * Best-effort Playwright scrape for ChamberData calendars behind Cloudflare.
 */

const { makeEvent, parseDate, parseTime } = require('../../core/normalize');

async function scrape(source) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    throw new Error('playwright is not installed');
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(4000);
    const text = await page.innerText('body');
    if (/just a moment/i.test(text) && text.length < 800) {
      throw new Error('Cloudflare challenge was not cleared');
    }
    const events = [];
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const window = lines.slice(i, i + 3).join(' ');
      const date = parseDate(window);
      if (!date) continue;
      const title = lines[i + 1] && !parseDate(lines[i + 1]) ? lines[i + 1] : lines[i];
      if (title.length < 4 || title.length > 160) continue;
      const time = (window.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i) || [])[1];
      const event = makeEvent({
        source: source.id,
        title,
        date,
        time: time ? parseTime(time) : 'TBD',
        city: source.options.defaultCity || '',
        url: source.url,
      });
      if (event) events.push(event);
    }
    return events;
  } finally {
    await browser.close();
  }
}

module.exports = { scrape };
