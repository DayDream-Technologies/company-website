const { fetchJson } = require('../core/fetch');
const { makeEvent, parseTime } = require('../core/normalize');

async function scrape(source) {
  const endpoint = new URL(source.options.apiUrl);
  if (source.options.search) endpoint.searchParams.set('search', source.options.search);
  endpoint.searchParams.set('days', String(source.options.days || 120));
  endpoint.searchParams.set('pp', '50');
  const data = await fetchJson(endpoint.toString());
  const events = [];
  for (const wrapper of data.events || []) {
    const item = wrapper.event || wrapper;
    const start = item.event_instances?.[0]?.event_instance?.start || item.start || '';
    const timeMatch = String(start).match(/T(\d{2}):(\d{2})/);
    const event = makeEvent({
      source: source.id,
      title: item.title,
      description: item.description_text || item.description,
      date: String(start).slice(0, 10),
      time: timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]}`) : 'TBD',
      locationName: item.location_name || item.location || '',
      city: item.city || source.options.defaultCity || '',
      url: item.localist_url || item.url || source.url,
    });
    if (event) events.push(event);
  }
  return events;
}

module.exports = { scrape };
