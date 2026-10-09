/**
 * Best-effort Playwright scrape of the statewide Michigan SBDC Blackthorn widget.
 * Installed only in the headless CI job. Returns [] with an error if Playwright
 * is not available so the rest of the run still succeeds.
 */

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
    // Blackthorn keeps analytics connections open, so networkidle never arrives.
    await page.goto(source.options.widgetUrl || source.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('a, [class*="event"]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const rows = await page.$$eval('a, [class*="event"]', (nodes) => nodes.slice(0, 80).map((node) => ({
      title: (node.innerText || '').trim().slice(0, 180),
      href: node.href || '',
    })));
    const { makeEvent, parseDate } = require('../../core/normalize');
    const events = [];
    for (const row of rows) {
      const date = parseDate(row.title);
      if (!date) continue;
      const event = makeEvent({
        source: source.id,
        title: row.title,
        date,
        url: row.href || source.url,
        isVirtual: /webinar|virtual|online/i.test(row.title),
      });
      if (event) events.push(event);
    }
    return events;
  } finally {
    await browser.close();
  }
}

module.exports = { scrape };
