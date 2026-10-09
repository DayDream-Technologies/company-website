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

function parseLocation(raw) {
  if (!raw) return { locationName: '', address: '', city: '' };
  // If LOCATION is just a URL, treat it as empty
  if (/^https?:\/\//i.test(raw.trim())) return { locationName: '', address: '', city: '' };
  const parts = raw.split(',').map((s) => s.trim());
  // ", City, MI" or ", City, MI 49XXX" or ", City, Michigan"
  const miMatch = raw.match(/,\s*([^,]+),\s*(?:MI|Michigan)\b/i);
  // ", City, ST" (two-letter state)
  const stateMatch = !miMatch && raw.match(/,\s*([^,]+),\s*[A-Z]{2}\b/);
  const city = miMatch ? miMatch[1].trim() : (stateMatch ? stateMatch[1].trim() : '');
  return { locationName: parts[0] || '', address: raw, city };
}

function eventsFromIcs(text, source) {
  const out = [];
  for (const vevent of parseIcs(text)) {
    const when = dateFromIcs(vevent.DTSTART);
    if (!when) continue;
    const raw = vevent.LOCATION || '';
    const loc = parseLocation(raw);
    // Only fall back to defaultCity when the ICS had no location at all.
    // If there WAS a location string but no recognizable city, leave city
    // empty so assignZone can drop events outside Michigan.
    const hasLocation = raw && !/^https?:\/\//i.test(raw.trim());
    const city = loc.city || (hasLocation ? '' : (source.options?.defaultCity || ''));
    const event = makeEvent({
      source: source.id,
      title: vevent.SUMMARY,
      description: vevent.DESCRIPTION,
      date: when.date,
      time: when.time,
      locationName: loc.locationName,
      address: loc.address,
      city,
      url: vevent.URL || source.url,
      isRecurring: Boolean(vevent.rrule),
      recurringKnown: Boolean(vevent.rrule),
      isVirtual: /zoom|virtual|online/i.test(raw),
    });
    if (!event) continue;
    // Flag events that had a physical location string but no recognized city,
    // so assignZone can drop them instead of defaulting to the source zone.
    if (hasLocation && !city) event._unknownCity = true;
    out.push(event);
  }
  return out;
}

module.exports = { parseIcs, eventsFromIcs, dateFromIcs };
