const { fetchJson } = require('../core/fetch');
const { makeEvent, parseTime } = require('../core/normalize');

async function scrape(source) {
  const url = source.url.includes('format=json') ? source.url : `${source.url}${source.url.includes('?') ? '&' : '?'}format=json`;
  const data = await fetchJson(url);
  const list = data.upcoming || data.items || data.collection?.items || [];
  const events = [];
  for (const item of list) {
    const start = item.startDate || item.structuredContent?.startDate || '';
    const timeMatch = String(start).match(/T(\d{2}):(\d{2})/);
    const loc = item.location || item.structuredContent?.location || {};
    const event = makeEvent({
      source: source.id,
      title: item.title,
      description: item.excerpt || item.body,
      date: String(start).slice(0, 10) || undefined,
      time: timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]}`) : 'TBD',
      locationName: loc.addressTitle || loc.name || '',
      address: loc.addressLine1 || '',
      city: loc.addressLine2?.split(',')[0] || source.options.defaultCity || '',
      url: item.fullUrl || item.sourceUrl || source.url,
    });
    if (event) events.push(event);
  }
  return events;
}

module.exports = { scrape };
