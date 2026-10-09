const { fetchText } = require('../core/fetch');
const { eventsFromIcs } = require('./ics-parse');

async function scrape(source) {
  const url = source.options.icsUrl || source.url;
  const text = await fetchText(url, { accept: 'text/calendar,*/*' });
  return eventsFromIcs(text, source).map((event) => ({
    ...event,
    location: {
      ...event.location,
      city: event.location.city || source.options.defaultCity || '',
    },
  }));
}

module.exports = { scrape };
