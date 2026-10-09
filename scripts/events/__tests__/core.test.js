const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDate, makeEvent, inferYear } = require('../core/normalize');
const { applyFilters, categorizeEvent, isExcluded, matchesKeyword } = require('../core/filters');
const { assignZone, zoneForCity } = require('../core/zones');
const { dedupeEvents } = require('../core/dedupe');
const { eventsFromIcs } = require('../adapters/ics-parse');
const { eventFromJsonLd } = require('../adapters/jsonld');
const { parseGoogleDates } = require('../adapters/wix-gcal');

test('parseDate reads month names and ISO dates', () => {
  assert.equal(parseDate('October 9, 2026'), '2026-10-09');
  assert.equal(parseDate('2026-10-09T18:00:00'), '2026-10-09');
  assert.equal(parseDate('10/09/2026'), '2026-10-09');
});

test('inferYear rolls a past month-day into next year', () => {
  const date = inferYear('January 2', new Date('2026-10-09T12:00:00Z'));
  assert.equal(date, '2027-01-02');
});

test('filters drop ribbon cuttings and past events', () => {
  const source = { filterMode: 'business', id: 'chamber' };
  const ribbon = makeEvent({ source: 'chamber', title: 'Ribbon Cutting at Cafe', date: '2026-11-01', city: 'Midland' });
  assert.equal(applyFilters(ribbon, source, new Date('2026-10-09T12:00:00Z')), null);
  const past = makeEvent({ source: 'chamber', title: 'Business After Hours', date: '2026-01-02', city: 'Midland' });
  assert.equal(isExcluded(past), false);
  assert.equal(applyFilters(past, source, new Date('2026-10-09T12:00:00Z')), null);
});

test('keyword mode keeps entrepreneurship events and drops concerts that already failed exclusion', () => {
  const source = { filterMode: 'keyword', id: 'noisy' };
  const keep = makeEvent({ source: 'noisy', title: 'Founder networking meetup', date: '2026-11-02', city: 'Kalamazoo' });
  const drop = makeEvent({ source: 'noisy', title: 'Farmers market weekend', date: '2026-11-02', city: 'Kalamazoo' });
  assert.equal(matchesKeyword(keep), true);
  assert.ok(applyFilters(keep, source, new Date('2026-10-09T12:00:00Z')));
  assert.equal(applyFilters(drop, source, new Date('2026-10-09T12:00:00Z')), null);
});

test('categorizeEvent maps pitch and networking', () => {
  assert.equal(categorizeEvent('Pitch night', ''), 'pitch');
  assert.equal(categorizeEvent('Business After Hours', ''), 'networking');
});

test('zone assignment uses city and keeps virtual events on the source zone', () => {
  assert.equal(zoneForCity('East Grand Rapids').id, 'grand-rapids');
  assert.equal(zoneForCity('Auburn Hills').id, 'rochester-hills');
  assert.equal(zoneForCity('Holland').id, 'holland');
  const source = { zone: 'grand-rapids', id: 'bamboo' };
  const annArbor = makeEvent({
    source: 'bamboo',
    title: 'Founder coffee',
    date: '2026-11-03',
    city: 'Ann Arbor',
  });
  const assigned = assignZone(applyFilters(annArbor, { ...source, filterMode: 'all' }, new Date('2026-10-09T12:00:00Z')), source);
  assert.equal(assigned.region, 'southeast');
  assert.equal(assigned.zone, 'ann-arbor');
  const virtual = makeEvent({
    source: 'bamboo',
    title: 'Virtual workshop',
    date: '2026-11-03',
    isVirtual: true,
  });
  const kept = assignZone({ ...virtual, isVirtual: true }, source);
  assert.equal(kept.zone, 'grand-rapids');
});

test('dedupe keeps the higher priority source', () => {
  const low = { title: 'Morrison in the Morning', date: '2026-11-04', source: 'aggregator', startDateTime: '2026-11-04T08:00:00', _priority: 20 };
  const high = { title: 'Morrison in the Morning!', date: '2026-11-04', source: 'leap', startDateTime: '2026-11-04T08:00:00', _priority: 90 };
  const [winner] = dedupeEvents([low, high]);
  assert.equal(winner.source, 'leap');
  assert.deepEqual(winner.alsoListedBy, ['aggregator']);
});

test('ics and json-ld adapters parse fixtures', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'DTSTART:20261104T140000Z',
    'SUMMARY:Founder meetup',
    'LOCATION:TechTown, Detroit, MI',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
  const parsed = eventsFromIcs(ics, { id: 'demo', url: 'https://example.com', options: {} });
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].date, '2026-11-04');
  assert.equal(parsed[0].location.city, 'Detroit');

  const fromLd = eventFromJsonLd({
    '@type': 'Event',
    name: 'Pitch night',
    startDate: '2026-12-01T18:00:00',
    location: { name: 'SPARK', address: { addressLocality: 'Ann Arbor', addressRegion: 'MI' } },
    offers: { price: '0', priceCurrency: 'USD' },
  }, 'spark');
  assert.equal(fromLd.location.city, 'Ann Arbor');
  assert.equal(fromLd.isFree, true);
  assert.equal(fromLd.freeKnown, true);
});

test('wix google calendar dates parse', () => {
  assert.deepEqual(parseGoogleDates('20261028T150000Z/20261028T160000Z'), {
    date: '2026-10-28',
    time: '3:00 PM',
  });
});
