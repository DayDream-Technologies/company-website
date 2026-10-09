const cheerio = require('cheerio');
const { fetchText, delay } = require('../core/fetch');
const { categorizeEvent, detectFreeEvent, detectRecurringEvent } = require('../core/filters');
const { parseTime, toISODateTime, generateEventId } = require('../core/normalize');
const {
  parseChamberMasterEventDetail,
  parseGrowthZoneEventCalendarDetail,
} = require('../../lib/parse-chambermaster-event-detail');

function parserContext(source) {
  return {
    sourceId: source.id,
    scrapedAt: new Date().toISOString(),
    parseTime,
    toISODateTime,
    generateEventId,
    detectRecurringEvent,
    detectFreeEvent,
    categorizeEvent,
    defaultDescription: '',
    defaultLocation: {
      name: '',
      address: '',
      city: source.options.defaultCity || '',
      state: 'MI',
    },
  };
}

async function scrapeListing(source, { linkPattern, parse }) {
  const html = await fetchText(source.url, { googlebot: Boolean(source.options.googlebot) });
  const $ = cheerio.load(html);
  const links = new Set();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && linkPattern.test(href)) {
      links.add(new URL(href, source.url).toString().split('#')[0]);
    }
  });
  const events = [];
  const limit = source.options.limit || 25;
  let count = 0;
  for (const link of links) {
    if (count >= limit) break;
    count += 1;
    try {
      const page = await fetchText(link, { googlebot: Boolean(source.options.googlebot) });
      const parsed = parse(cheerio.load(page), link, parserContext(source));
      if (parsed) events.push(parsed);
    } catch (error) {
      console.warn(`  detail failed ${link}: ${error.message}`);
    }
    await delay(500);
  }
  return events;
}

async function scrapeChamberMaster(source) {
  return scrapeListing(source, {
    linkPattern: /\/events\/details\//i,
    parse: parseChamberMasterEventDetail,
  });
}

async function scrapeGrowthZone(source) {
  return scrapeListing(source, {
    linkPattern: /\/(event-calendar|events|calendar)\/details\//i,
    parse: parseGrowthZoneEventCalendarDetail,
  });
}

module.exports = { scrapeChamberMaster, scrapeGrowthZone };
