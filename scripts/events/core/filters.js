/**
 * Uniform filters applied to every source after scraping.
 */

const { cleanText } = require('./normalize');

const KNOWN_RECURRING_EVENTS = [
  'chamber happy hour',
  'business exchange',
  'latina connect',
  'coffee connect',
  'networking lunch',
  'weekly meetup',
  'monthly meetup',
  'office hours',
  'open house',
  'coworking day',
  'first friday',
  'third thursday',
  '1 million cups',
  'one million cups',
  'founders first friday',
  'wake up',
  'eye opener',
  'morning mingle',
  'code & coffee',
  'code and coffee',
];

const RECURRING_PATTERNS = [
  /\bevery\s+(week|month|day|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /\bweekly\b/i,
  /\bmonthly\b/i,
  /\bdaily\b/i,
  /\brecurring\b/i,
  /\bongoing\b/i,
  /\b(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /\bevery\s+\d+(st|nd|rd|th)/i,
  /\bthroughout\s+the\s+year\b/i,
];

const EXCLUSIONS = [
  /ribbon\s*cutting/i,
  /\bboard\s+meeting\b/i,
  /\bcommittee\s+meeting\b/i,
  /\bcancelled\b/i,
  /\bcanceled\b/i,
  /alumni\s+only/i,
  /^member\s+event:/i,
  /\b5k\b/i,
  /trunk[\s-]or[\s-]treat/i,
  /\bconcert\b/i,
];

const NAV_TITLES = new Set([
  'events',
  'filters',
  'view details',
  'book a tour',
  'contact us',
  'news',
  'contact',
  'about us',
  'home',
  'upcoming events',
  'past events',
  'filter',
  'events search and views navigation',
]);

const INCLUDE_KEYWORDS = [
  'startup',
  'founder',
  'entrepreneur',
  'pitch',
  'venture',
  'investor',
  'angel',
  'accelerator',
  'incubator',
  'networking',
  'mixer',
  'after hours',
  'small business',
  'young professional',
  'coworking',
  'innovation',
  'tech',
  ' ai',
  'ai ',
  'workshop',
  'sbdc',
  'score',
  '1 million cups',
  'million cups',
  'meetup',
  'happy hour',
  'business after',
];

function eventText(event) {
  return `${event.title || ''} ${event.description || ''} ${event.location?.name || ''} ${event.location?.city || ''}`;
}

function detectRecurringEvent(title, description = '', timeText = '') {
  const combinedText = `${title} ${description} ${timeText}`.toLowerCase();
  for (const knownTitle of KNOWN_RECURRING_EVENTS) {
    if (combinedText.includes(knownTitle)) return true;
  }
  for (const pattern of RECURRING_PATTERNS) {
    if (pattern.test(combinedText)) return true;
  }
  return false;
}

function detectFreeEvent(title, description = '', extraText = '') {
  const text = `${title} ${description} ${extraText}`.toLowerCase();
  if (text.includes('members only') || text.includes('member only')) return false;
  if (text.includes('private event')) return false;
  if (text.includes('get tickets') || text.includes('buy tickets')) return false;
  if (text.includes('purchase tickets')) return false;
  if (/\$\d+/.test(text)) return false;
  if (text.includes('registration fee') || text.includes('admission fee')) return false;
  if (text.includes('ticket price') || text.includes('event fee')) return false;
  if (text.includes('paid event')) return false;
  if (text.includes('free event') || text.includes('free admission')) return true;
  if (text.includes('no cost') || text.includes('no charge') || text.includes('no fee')) return true;
  if (/\bfree\b/.test(text) && !text.includes('free parking')) return true;
  if (text.includes('public event') && !text.includes('ticket')) return true;
  if (text.includes('community coworking')) return true;
  if (text.includes('open house') && !text.includes('ticket')) return true;
  return true;
}

function categorizeEvent(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('pitch') || text.includes('startup') || text.includes('founder') || text.includes('venture') || text.includes('entrepreneur')) return 'pitch';
  if (text.includes('workshop') || text.includes('training') || text.includes('session') || text.includes('101') || text.includes('leadership') || text.includes('candid conversation')) return 'workshop';
  if (text.includes('summit') || text.includes('conference') || text.includes('gala') || text.includes('awards') || text.includes('forum') || text.includes('outlook')) return 'conference';
  if (text.includes('accelerator') || text.includes('incubator') || text.includes('office hours') || text.includes('mentorship') || text.includes('cohort')) return 'accelerator';
  if (text.includes('network') || text.includes('mixer') || text.includes('meetup') || text.includes('connection') || text.includes('happy hour') || text.includes('after hours') || text.includes('social') || text.includes('coffee') || text.includes('exchange')) return 'networking';
  if (text.includes('panel')) return 'meetup';
  return 'other';
}

function isExcluded(event) {
  const title = cleanText(event.title);
  if (!title || title.length < 3) return true;
  if (NAV_TITLES.has(title.toLowerCase())) return true;
  if (/^view\s/i.test(title) || /sponsorship/i.test(title)) return true;
  const text = eventText(event);
  return EXCLUSIONS.some((re) => re.test(text));
}

function matchesKeyword(event) {
  const text = ` ${eventText(event).toLowerCase()} `;
  if (INCLUDE_KEYWORDS.some((word) => text.includes(word))) return true;
  return /\bai\b/.test(text);
}

function isUpcoming(event, now = new Date(), horizonDays = 180) {
  if (!event.date) return false;
  const today = now.toISOString().slice(0, 10);
  const end = event.endDate || event.date;
  if (end < today) return false;
  const horizon = new Date(now.getTime() + horizonDays * 86400000).toISOString().slice(0, 10);
  if (event.date > horizon) return false;
  return true;
}

function isVirtualEvent(event) {
  if (event.isVirtual) return true;
  const blob = `${event.location?.name || ''} ${event.location?.city || ''} ${event.location?.address || ''} ${event.title || ''}`.toLowerCase();
  if (!cleanText(event.location?.city) && !cleanText(event.location?.address)) {
    return /zoom|virtual|webinar|online|teams|google meet/.test(blob);
  }
  return /\b(zoom|virtual|webinar|online only)\b/.test(blob) && !cleanText(event.location?.city);
}

function applyFilters(event, source, now = new Date()) {
  if (!event || isExcluded(event)) return null;
  if (source.titleMustMatch && !source.titleMustMatch.test(`${event.title} ${event.description}`)) return null;
  if (!isUpcoming(event, now, source.horizonDays || 180)) return null;
  const mode = source.filterMode || 'all';
  if (mode === 'keyword' && !matchesKeyword(event)) return null;

  const description = event.description || '';
  const isRecurring = event.recurringKnown
    ? Boolean(event.isRecurring)
    : Boolean(event.isRecurring) || detectRecurringEvent(event.title, description, event.time);
  const isFree = event.freeKnown
    ? event.isFree !== false
    : detectFreeEvent(event.title, description);

  return {
    ...event,
    category: categorizeEvent(event.title, description),
    isRecurring,
    isFree,
    isVirtual: isVirtualEvent(event),
  };
}

module.exports = {
  KNOWN_RECURRING_EVENTS,
  EXCLUSIONS,
  INCLUDE_KEYWORDS,
  detectRecurringEvent,
  detectFreeEvent,
  categorizeEvent,
  isExcluded,
  matchesKeyword,
  isUpcoming,
  isVirtualEvent,
  applyFilters,
};
