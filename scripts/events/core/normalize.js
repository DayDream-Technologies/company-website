/**
 * Shared event text and date helpers.
 * Extracted from scripts/scrape-events.js.
 */

const MONTHS = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

function cleanText(text) {
  if (!text) return '';
  return String(text).replace(/\s+/g, ' ').trim();
}

function decodeEntities(text) {
  if (!text) return '';
  return String(text)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'");
}

function stripHtml(html) {
  if (!html) return '';
  return decodeEntities(String(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function generateEventId(source, title, date) {
  return `${source}-${title}-${date}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 64);
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = decodeEntities(String(dateStr)).trim().replace(/\s+/g, ' ');

  const monthMatch = cleaned.match(/([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthMatch) {
    const month = MONTHS[monthMatch[1].toLowerCase()];
    if (month) {
      return `${monthMatch[3]}-${month}-${monthMatch[2].padStart(2, '0')}`;
    }
  }

  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[1].padStart(2, '0')}-${slashMatch[2].padStart(2, '0')}`;
  }

  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const dotted = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotted) {
    return `${dotted[3]}-${dotted[1].padStart(2, '0')}-${dotted[2].padStart(2, '0')}`;
  }

  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime()) && cleaned.length > 6) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }
  return null;
}

function parseTime(timeStr) {
  if (!timeStr) return 'TBD';
  const cleaned = String(timeStr).trim().replace(/\s+/g, ' ');

  if (/^\d{1,2}:\d{2}\s+(AM|PM|am|pm)$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  const noSpaceMatch = cleaned.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (noSpaceMatch) {
    return `${noSpaceMatch[1]}:${noSpaceMatch[2]} ${noSpaceMatch[3].toUpperCase()}`;
  }
  const hourOnlyMatch = cleaned.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (hourOnlyMatch) {
    return `${hourOnlyMatch[1]}:00 ${hourOnlyMatch[2].toUpperCase()}`;
  }
  const militaryMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    let hour = parseInt(militaryMatch[1], 10);
    const minute = militaryMatch[2];
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${period}`;
  }
  return cleaned;
}

function normalizeGluedYearBeforeTime(text) {
  if (!text) return text;
  return String(text).replace(/(\d{4})(?=\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/g, '$1 ');
}

function parseTimeRangeOrSingleFromText(text) {
  const normalized = normalizeGluedYearBeforeTime(text || '');
  const rangeRe = /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\s*[\u2013\u2014-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i;
  const rangeMatch = normalized.match(rangeRe);
  if (rangeMatch) {
    const start = parseTime(rangeMatch[1]);
    const end = parseTime(rangeMatch[2]);
    if (start !== 'TBD' && end !== 'TBD') {
      return { display: `${start} – ${end}`, startForIso: start, endForIso: end };
    }
  }
  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (timeMatch) {
    const t = parseTime(`${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3]}`);
    return { display: t, startForIso: t, endForIso: null };
  }
  return { display: 'TBD', startForIso: 'TBD', endForIso: null };
}

function toISODateTime(date, time) {
  if (!date) return null;
  const timeMatch = String(time || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!timeMatch) return `${date}T00:00:00`;
  let hour = parseInt(timeMatch[1], 10);
  const minute = timeMatch[2];
  const period = timeMatch[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${date}T${hour.toString().padStart(2, '0')}:${minute}:00`;
}

/**
 * Build a normalized event. Missing fields get safe defaults.
 */
function makeEvent(partial) {
  const title = decodeEntities(cleanText(partial.title));
  const date = partial.date && /^\d{4}-\d{2}-\d{2}$/.test(partial.date)
    ? partial.date
    : parseDate(partial.date);
  if (!title || !date) return null;
  const time = partial.time && partial.time !== 'TBD' ? parseTime(partial.time) : (partial.time || 'TBD');
  const city = cleanText(partial.city || partial.location?.city || '');
  const state = cleanText(partial.state || partial.location?.state || 'MI') || 'MI';
  const description = stripHtml(partial.description || '');
  const source = partial.source;
  return {
    id: partial.id || generateEventId(source, title, date),
    title,
    description,
    date,
    time: time === 'TBD' ? 'TBD' : parseTime(time),
    startDateTime: partial.startDateTime || toISODateTime(date, time === 'TBD' ? '' : time),
    endDateTime: partial.endDateTime || null,
    endDate: partial.endDate || null,
    location: {
      name: cleanText(partial.locationName || partial.location?.name || ''),
      address: cleanText(partial.address || partial.location?.address || ''),
      city,
      state,
      ...(partial.location?.lat ? { lat: partial.location.lat, lng: partial.location.lng } : {}),
      ...(partial.lat ? { lat: partial.lat, lng: partial.lng } : {}),
    },
    url: partial.url || '',
    source,
    category: partial.category || 'other',
    isRecurring: Boolean(partial.isRecurring),
    recurringKnown: Boolean(partial.recurringKnown),
    isFree: partial.isFree !== false,
    freeKnown: Boolean(partial.freeKnown),
    isVirtual: Boolean(partial.isVirtual),
    scrapedAt: partial.scrapedAt || new Date().toISOString(),
  };
}

function inferYear(monthDayText, now = new Date()) {
  const md = String(monthDayText || '').match(/([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?/i)
    || String(monthDayText || '').match(/(\d{1,2})\/(\d{1,2})/);
  if (!md) return null;
  let month;
  let day;
  if (/[A-Za-z]/.test(md[1])) {
    month = MONTHS[md[1].toLowerCase()];
    day = md[2];
  } else {
    month = md[1].padStart(2, '0');
    day = md[2];
  }
  if (!month) return null;
  let year = now.getFullYear();
  const candidate = `${year}-${month}-${String(day).padStart(2, '0')}`;
  const today = now.toISOString().slice(0, 10);
  if (candidate < today) {
    const next = `${year + 1}-${month}-${String(day).padStart(2, '0')}`;
    return next;
  }
  return candidate;
}

module.exports = {
  MONTHS,
  cleanText,
  decodeEntities,
  stripHtml,
  generateEventId,
  parseDate,
  parseTime,
  normalizeGluedYearBeforeTime,
  parseTimeRangeOrSingleFromText,
  toISODateTime,
  makeEvent,
  inferYear,
};
