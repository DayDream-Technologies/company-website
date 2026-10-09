const { makeEvent, decodeEntities } = require('../core/normalize');

function unfold(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

function unescapeIcs(value) {
  return decodeEntities(String(value || '')
    .replace(/\\n/g, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\'));
}

function parseIcs(text) {
  const unfolded = unfold(text);
  const events = [];
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0];
    const fields = {};
    const extras = {};
    for (const line of body.split('\n')) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const left = line.slice(0, idx);
      const value = line.slice(idx + 1).trim();
      const key = left.split(';')[0].toUpperCase();
      if (key === 'DTSTART' && left.includes('TZID')) extras.tzid = true;
      if (!fields[key]) fields[key] = unescapeIcs(value);
      if (key === 'RRULE') extras.rrule = value;
    }
    if (fields.DTSTART && fields.DTSTART.startsWith('1970')) continue;
    events.push({ ...fields, ...extras });
  }
  return events;
}

function dateFromIcs(value) {
  const match = String(value || '').match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!match) return null;
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  if (!match[4]) return { date, time: 'TBD' };
  let hour = parseInt(match[4], 10);
  const minute = match[5];
  const period = hour >= 12 ? 'PM' : 'AM';
  let display = hour;
  if (display > 12) display -= 12;
  if (display === 0) display = 12;
  return { date, time: `${display}:${minute} ${period}` };
}

function eventsFromIcs(text, source) {
  const out = [];
  for (const vevent of parseIcs(text)) {
    const when = dateFromIcs(vevent.DTSTART);
    if (!when) continue;
    const location = vevent.LOCATION || '';
    const cityMatch = location.match(/,\s*([^,]+),\s*MI\b/i);
    const event = makeEvent({
      source: source.id,
      title: vevent.SUMMARY,
      description: vevent.DESCRIPTION,
      date: when.date,
      time: when.time,
      locationName: location.split(',')[0] || '',
      address: location,
      city: cityMatch ? cityMatch[1].trim() : (source.options?.defaultCity || ''),
      url: vevent.URL || source.url,
      isRecurring: Boolean(vevent.rrule),
      recurringKnown: Boolean(vevent.rrule),
      isVirtual: /zoom|virtual|online/i.test(location),
    });
    if (event) out.push(event);
  }
  return out;
}

module.exports = { parseIcs, eventsFromIcs, dateFromIcs };
