const cheerio = require('cheerio');
const { fetchText, delay } = require('../core/fetch');
const { extractJsonLdEvents, eventFromJsonLd } = require('./jsonld');

async function scrape(source) {
  const sitemapUrl = source.options.sitemapUrl;
  const xml = await fetchText(sitemapUrl, { accept: 'application/xml,text/xml,*/*' });
  const $ = cheerio.load(xml, { xmlMode: true });
  const locs = [];
  $('loc').each((_, el) => {
    const loc = $(el).text().trim();
    if (loc) locs.push(loc);
  });
  const events = [];
  const limit = source.options.limit || 40;
  let fetched = 0;
  for (const loc of locs) {
    if (events.length >= limit || fetched >= limit) break;
    fetched += 1;
    try {
      const html = await fetchText(loc);
      for (const node of extractJsonLdEvents(html, cheerio)) {
        const event = eventFromJsonLd(node, source.id);
        if (!event) continue;
        event.url = event.url || loc;
        if (!event.location.city && source.options.defaultCity) event.location.city = source.options.defaultCity;
        events.push(event);
      }
    } catch (error) {
      console.warn(`  jsonld ${loc}: ${error.message}`);
    }
    await delay(300);
  }
  return events;
}

module.exports = { scrape };
