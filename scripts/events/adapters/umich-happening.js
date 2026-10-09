const { fetchJson } = require('../core/fetch');
const { makeEvent, parseTime } = require('../core/normalize');

async function scrape(source) {
  const filter = source.options.filter || 'sponsors:3525,4822';
  const url = `https://events.umich.edu/list/json?filter=${encodeURIComponent(filter)}&v=2`;
  const data = await fetchJson(url);
  const list = Array.isArray(data) ? data : data.events || data.results || [];
  const events = [];
  for (const item of list) {
    const start = item.datetime_start || item.start || item.date || '';
    const timeMatch = String(start).match(/(\d{2}):(\d{2})/);
    const event = makeEvent({
      source: source.id,
      title: item.title || item.event_title,
      description: item.description,
      date: String(start).slice(0, 10),
      time: timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]}`) : 'TBD',
      locationName: item.location_name || item.building_name || '',
      city: 'Ann Arbor',
      url: item.permalink || item.url || source.url,
    });
    if (event) events.push(event);
  }
  return events;
}

module.exports = { scrape };
