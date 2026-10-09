const { fetchJson } = require('../core/fetch');
const { makeEvent, parseTime, stripHtml } = require('../core/normalize');

function originOf(url) {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}

async function scrape(source) {
  const today = new Date().toISOString().slice(0, 10);
  const api = source.options.apiUrl || `${originOf(source.url)}/wp-json/tribe/events/v1/events`;
  const endpoint = new URL(api);
  endpoint.searchParams.set('per_page', String(source.options.perPage || 50));
  endpoint.searchParams.set('start_date', today);
  if (source.options.categories) endpoint.searchParams.set('categories', source.options.categories);
  const data = await fetchJson(endpoint.toString());
  const events = [];
  for (const item of data.events || []) {
    const start = item.start_date || item.utc_start_date || '';
    const timeMatch = String(start).match(/(\d{2}):(\d{2})/);
    const venue = item.venue || {};
    const event = makeEvent({
      source: source.id,
      title: stripHtml(item.title),
      description: item.description || item.excerpt,
      date: String(start).slice(0, 10),
      time: timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]}`) : 'TBD',
      locationName: venue.venue || '',
      address: venue.address || '',
      city: venue.city || source.options.defaultCity || '',
      state: venue.state || 'MI',
      url: item.url || source.url,
      isVirtual: /virtual|online/i.test(`${venue.venue || ''} ${item.title || ''}`) && !venue.city,
    });
    if (event) events.push(event);
  }
  return events;
}

module.exports = { scrape };
