const { fetchText } = require('../core/fetch');
const { eventsFromIcs } = require('./ics-parse');

async function scrape(source) {
  const url = (source.options.icsUrl || source.url).replace(/^webcal:\/\//, 'https://');
  const text = await fetchText(url, { accept: 'text/calendar,*/*' });
  return eventsFromIcs(text, source);
}

module.exports = { scrape };
