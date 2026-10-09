const { makeEvent, parseTime } = require('../core/normalize');

function collectNodes(data, into) {
  if (!data) return;
  if (Array.isArray(data)) {
    data.forEach((item) => collectNodes(item, into));
    return;
  }
  if (typeof data !== 'object') return;
  const type = data['@type'];
  const types = Array.isArray(type) ? type : type ? [type] : [];
  if (types.some((t) => /event$/i.test(String(t)))) into.push(data);
  if (data['@graph']) collectNodes(data['@graph'], into);
  if (data.mainEntity) collectNodes(data.mainEntity, into);
}

function extractJsonLdEvents(html, cheerio) {
  const $ = cheerio.load(html);
  const events = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      collectNodes(JSON.parse($(el).text()), events);
    } catch {
      // ignore invalid blocks
    }
  });
  return events;
}

function timeFromIso(iso) {
  if (!iso || !iso.includes('T')) return 'TBD';
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return 'TBD';
  return parseTime(`${match[1]}:${match[2]}`);
}

function eventFromJsonLd(node, sourceId) {
  const start = node.startDate || '';
  const end = node.endDate || '';
  const loc = node.location && typeof node.location === 'object' ? node.location : {};
  const addr = loc.address && typeof loc.address === 'object' ? loc.address : {};
  const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
  let freeKnown = false;
  let isFree = true;
  if (offers && offers.price != null && offers.price !== '') {
    freeKnown = true;
    isFree = Number(offers.price) === 0;
  }
  const city = addr.addressLocality || '';
  const virtual = /virtual|online/i.test(`${loc.name || ''} ${node.eventAttendanceMode || ''}`);
  return makeEvent({
    source: sourceId,
    title: node.name,
    description: node.description,
    date: String(start).slice(0, 10),
    time: timeFromIso(String(start)),
    endDateTime: end ? String(end).slice(0, 19) : null,
    locationName: typeof loc.name === 'string' ? loc.name : '',
    address: addr.streetAddress || (typeof loc.address === 'string' ? loc.address : ''),
    city,
    state: addr.addressRegion || 'MI',
    url: node.url || '',
    isFree,
    freeKnown,
    isVirtual: virtual && !city,
  });
}

module.exports = { extractJsonLdEvents, eventFromJsonLd, timeFromIso };
