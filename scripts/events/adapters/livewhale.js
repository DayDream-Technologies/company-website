const { fetchJson } = require('../core/fetch');
const { makeEvent, parseTime } = require('../core/normalize');

async function scrape(source) {
  const keyword = encodeURIComponent(source.options.search || 'entrepreneur');
  const url = source.options.apiUrl || `${new URL(source.url).origin}/live/json/events/search/${keyword}/max/30`;
  const data = await fetchJson(url);
  const list = Array.isArray(data) ? data : data.events || [];
  const events = [];
  for (const item of list) {
    const start = item.date_iso || item.start || item.date || '';
    const timeMatch = String(start).match(/T(\d{2}):(\d{2})/);
    const event = makeEvent({
      source: source.id,
      title: item.title,
      description: item.description,
      date: String(start).slice(0, 10),
      time: timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]}`) : parseTime(item.time || ''),
      locationName: item.location || '',
      city: source.options.defaultCity || 'Rochester Hills',
      url: item.url || source.url,
    });
    if (event) events.push(event);
  }
  return events;
}

module.exports = { scrape };
