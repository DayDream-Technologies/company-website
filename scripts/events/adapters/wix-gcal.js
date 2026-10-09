const { fetchText } = require('../core/fetch');
const { makeEvent, decodeEntities } = require('../core/normalize');

function parseGoogleDates(value) {
  const match = String(value).match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!match) return null;
  let hour = parseInt(match[4], 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  let display = hour;
  if (display > 12) display -= 12;
  if (display === 0) display = 12;
  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: `${display}:${match[5]} ${period}`,
  };
}

async function scrape(source) {
  const html = await fetchText(source.url);
  const events = [];
  const pattern = /action=TEMPLATE[^"'\s]*/gi;
  const seen = new Set();
  for (const raw of html.match(pattern) || []) {
    const params = new URLSearchParams(raw.replace(/^action=TEMPLATE&?/, ''));
    const text = decodeEntities(params.get('text') || '');
    const when = parseGoogleDates(params.get('dates') || '');
    const location = decodeEntities(params.get('location') || '');
    if (!when || seen.has(`${text}|${when.date}`)) continue;
    seen.add(`${text}|${when.date}`);
    const city = location.split(',')[1]?.trim() || source.options.defaultCity || '';
    const event = makeEvent({
      source: source.id,
      title: text,
      date: when.date,
      time: when.time,
      locationName: location.split(',')[0] || '',
      address: location,
      city,
      url: source.url,
    });
    if (event) events.push(event);
  }
  return events;
}

module.exports = { scrape, parseGoogleDates };
