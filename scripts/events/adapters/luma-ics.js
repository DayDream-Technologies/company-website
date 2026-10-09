const { fetchText } = require('../core/fetch');
const { eventsFromIcs } = require('./ics-parse');

async function scrapeCalendar(source, url) {
  const text = await fetchText(url, { accept: 'text/calendar,*/*' });
  return eventsFromIcs(text, source);
}

async function scrape(source) {
  if (source.options.discoverPage) {
    const html = await fetchText(source.options.discoverPage);
    const ids = [...new Set([...html.matchAll(/cal-[A-Za-z0-9]+/g)].map((match) => match[0]))].slice(0, 15);
    const events = [];
    for (const id of ids) {
      try {
        events.push(...await scrapeCalendar(source, `https://api.lu.ma/ics/get?entity=calendar&id=${id}`));
      } catch (error) {
        console.warn(`  luma calendar ${id}: ${error.message}`);
      }
    }
    return events;
  }
  const calendarId = source.options.calendarId;
  const url = source.options.icsUrl
    || `https://api.lu.ma/ics/get?entity=calendar&id=${calendarId}`;
  return scrapeCalendar(source, url);
}

module.exports = { scrape };
