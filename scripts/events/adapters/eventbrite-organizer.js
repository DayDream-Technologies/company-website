const cheerio = require('cheerio');
const { fetchText, delay } = require('../core/fetch');
const { extractJsonLdEvents, eventFromJsonLd } = require('./jsonld');

async function scrape(source) {
  const html = await fetchText(source.url);
  const links = new Set();
  const pattern = /https:\/\/www\.eventbrite\.com\/e\/[a-z0-9-]+(?:-tickets-\d+)?/gi;
  for (const match of html.match(pattern) || []) {
    links.add(match.split('?')[0]);
  }
  const events = [];
  const limit = source.options.limit || 15;
  let count = 0;
  for (const link of links) {
    if (count >= limit) break;
    count += 1;
    try {
      const page = await fetchText(link);
      const nodes = extractJsonLdEvents(page, cheerio);
      for (const node of nodes) {
        const event = eventFromJsonLd(node, source.id);
        if (event) {
          event.url = event.url || link;
          if (!event.location.city && source.options.defaultCity) {
            event.location.city = source.options.defaultCity;
          }
          events.push(event);
        }
      }
    } catch (error) {
      console.warn(`  eventbrite ${link}: ${error.message}`);
    }
    await delay(400);
  }
  return events;
}

module.exports = { scrape };
