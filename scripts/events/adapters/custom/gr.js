const legacy = require('./gr-legacy');

async function scrape(source) {
  const fn = legacy[source.options.fn];
  if (!fn) throw new Error(`Unknown GR scraper ${source.options.fn}`);
  const result = await fn();
  if (!result.success) throw new Error(result.error || 'scrape failed');
  return (result.events || []).map((event) => ({
    ...event,
    source: source.id,
    category: event.category || 'other',
  }));
}

module.exports = { scrape };
