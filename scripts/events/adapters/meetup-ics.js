const { fetchText } = require('../core/fetch');
const { eventsFromIcs } = require('./ics-parse');

async function scrape(source) {
  const url = source.options.icsUrl || source.url;
  const text = await fetchText(url, { accept: 'text/calendar,*/*' });
  return eventsFromIcs(text, source).map((event) => {
    // Only apply defaultCity when the ICS had no location at all
    const hasRawLocation = event.location.address && event.location.address.length > 0;
    return {
      ...event,
      location: {
        ...event.location,
        city: event.location.city || (hasRawLocation ? '' : (source.options.defaultCity || '')),
      },
    };
  });
}

module.exports = { scrape };
