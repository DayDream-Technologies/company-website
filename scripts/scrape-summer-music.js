#!/usr/bin/env node
/**
 * GR Summer Music - Scrape Script
 *
 * Scrapes summer concert and outdoor music events from West Michigan sources
 * and saves them to src/data/summer-music-events.json.
 * Run with: node scripts/scrape-summer-music.js
 */

const fs = require('fs').promises;
const path = require('path');

let cheerio;
try {
  cheerio = require('cheerio');
} catch (e) {
  console.error('Error: cheerio is required. Install with: npm install cheerio');
  process.exit(1);
}

// =============================================================================
// Configuration
// =============================================================================

const SOURCE_CONFIG = {
  'local-spins': {
    id: 'local-spins',
    name: 'Local Spins',
    url: 'https://localspins.com/free-outdoor-community-concerts-2026/',
    color: '#E91E63',
  },
  'downtown-gr': {
    id: 'downtown-gr',
    name: 'Downtown GR (Rosa Parks Circle)',
    url: 'https://downtowngr.org/announcements/2025/04/relax-at-rosa-2025',
    color: '#1565C0',
  },
  'meijer-gardens': {
    id: 'meijer-gardens',
    name: 'Meijer Gardens',
    url: 'https://www.meijergardens.org/calendar/tuesday-evening-music-club/',
    color: '#2E7D32',
  },
  'coopersville-farm': {
    id: 'coopersville-farm',
    name: 'Coopersville Farm Museum',
    url: 'https://www.coopersvillefarmmuseum.org/',
    color: '#795548',
  },
  'wm-jazz': {
    id: 'wm-jazz',
    name: 'WM Jazz (Jazz Around West Michigan)',
    url: 'https://wmichjazz.org/jazz-around-west-michigan',
    color: '#6A1B9A',
  },
  'worship-waterfront': {
    id: 'worship-waterfront',
    name: 'Worship on the Waterfront',
    url: 'https://worshiponthewaterfront.com/',
    color: '#1976D2',
  },
  'maranatha': {
    id: 'maranatha',
    name: 'Maranatha Michigan',
    url: 'https://maranathamichigan.org/summer-concert-series/',
    color: '#F57C00',
  },
  'sandy-pines': {
    id: 'sandy-pines',
    name: 'Sandy Pines',
    url: 'https://sandypines.com/event/chapel-pm-concerts/',
    color: '#00695C',
  },
  'dunnebackgirls': {
    id: 'dunnebackgirls',
    name: 'Dunneback & Girls',
    url: 'https://www.dunnebackgirls.com/eventsandmusic',
    color: '#AD1457',
  },
  'beacon-hill': {
    id: 'beacon-hill',
    name: 'Beacon Hill',
    url: 'https://beaconhillgr.org/concerts26/',
    color: '#37474F',
  },
  'stray-cafe': {
    id: 'stray-cafe',
    name: 'The Stray Cafe',
    url: 'https://www.thestraycafe.com/events',
    color: '#BF360C',
  },
  'founders-brewing': {
    id: 'founders-brewing',
    name: 'Founders Brewing',
    url: 'https://foundersbrewing.com/visit-connect/grand-rapids-taproom/',
    color: '#1B5E20',
  },
  'gilmore-bluewater': {
    id: 'gilmore-bluewater',
    name: 'Gilmore Collection (Bluewater)',
    url: 'https://www.thegilmorecollection.com/bluewater/entertainment/',
    color: '#0277BD',
  },
  'wm-jazz-park': {
    id: 'wm-jazz-park',
    name: 'WM Jazz in the Park',
    url: 'https://wmichjazz.org/jazz-in-the-park',
    color: '#4A148C',
  },
  'cork-wine': {
    id: 'cork-wine',
    name: 'Cork Wine & Grille',
    url: 'https://corkwineandgrille.com/happenings/',
    color: '#880E4F',
  },
  'score-gr': {
    id: 'score-gr',
    name: 'The Score GR',
    url: 'https://www.thescoregr.com/event-calendar/',
    color: '#FF6F00',
  },
};

const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'summer-music-events.json');
const CACHE_FILE = path.join(__dirname, '..', 'src', 'data', 'geocache.json');

// =============================================================================
// Utility Functions (mirrors scrape-events.js)
// =============================================================================

function generateEventId(source, title, date) {
  const normalized = `${source}-${title}-${date}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 64);
  return normalized;
}

const MONTHS = {
  'jan': '01', 'january': '01',
  'feb': '02', 'february': '02',
  'mar': '03', 'march': '03',
  'apr': '04', 'april': '04',
  'may': '05',
  'jun': '06', 'june': '06',
  'jul': '07', 'july': '07',
  'aug': '08', 'august': '08',
  'sep': '09', 'september': '09',
  'oct': '10', 'october': '10',
  'nov': '11', 'november': '11',
  'dec': '12', 'december': '12',
};

function parseDate(dateStr) {
  if (!dateStr) return null;

  const cleaned = dateStr.trim().replace(/\s+/g, ' ');

  const monthMatch = cleaned.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthMatch) {
    const month = MONTHS[monthMatch[1].toLowerCase()];
    if (month) {
      const day = monthMatch[2].padStart(2, '0');
      return `${monthMatch[3]}-${month}-${day}`;
    }
  }

  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    return `${slashMatch[3]}-${month}-${day}`;
  }

  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Ignore
  }

  return null;
}

function parseTime(timeStr) {
  if (!timeStr) return 'TBD';

  const cleaned = timeStr.trim().replace(/\s+/g, ' ');

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
    let hour = parseInt(militaryMatch[1]);
    const minute = militaryMatch[2];
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${period}`;
  }

  return cleaned;
}

function toISODateTime(date, time) {
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!timeMatch) {
    return `${date}T00:00:00`;
  }

  let hour = parseInt(timeMatch[1]);
  const minute = timeMatch[2];
  const period = timeMatch[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return `${date}T${hour.toString().padStart(2, '0')}:${minute}:00`;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.text();
}

function loadHtml(html) {
  return cheerio.load(html);
}

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createScrapeResult(source, events, error) {
  return {
    success: !error,
    source,
    events,
    error,
    scrapedAt: new Date().toISOString(),
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// Music-specific Detection
// =============================================================================

const SUMMER_MONTHS = [5, 6, 7, 8, 9]; // May–September

function isSummerDate(dateStr) {
  if (!dateStr) return true; // allow through if unknown
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const month = d.getMonth() + 1;
  return SUMMER_MONTHS.includes(month);
}

function detectFreeEvent(title, description, extraText) {
  const text = `${title} ${description} ${extraText || ''}`.toLowerCase();

  if (text.includes('members only') || text.includes('member only')) return false;
  if (text.includes('private event')) return false;
  if (text.includes('get tickets') || text.includes('buy tickets')) return false;
  if (text.includes('purchase tickets')) return false;
  if (/\$\d+/.test(text)) return false;
  if (text.includes('registration fee') || text.includes('admission fee')) return false;
  if (text.includes('ticket price') || text.includes('paid event')) return false;

  if (text.includes('free event') || text.includes('free admission')) return true;
  if (text.includes('free concert') || text.includes('free outdoor')) return true;
  if (text.includes('no cost') || text.includes('no charge') || text.includes('no fee')) return true;
  if (/\bfree\b/.test(text) && !text.includes('free parking')) return true;
  if (text.includes('community concert') || text.includes('outdoor concert')) return true;

  return true;
}

function detectRecurringEvent(title, description, timeText) {
  const text = `${title} ${description} ${timeText}`.toLowerCase();
  const patterns = [
    /\bevery\s+(week|month|day|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /\bweekly\b/i, /\bmonthly\b/i, /\bdaily\b/i, /\brecurring\b/i, /\bongoing\b/i,
    /\b(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /\bthroughout\s+the\s+summer\b/i,
    /\bevery\s+tuesday\b/i, /\bevery\s+friday\b/i, /\bevery\s+sunday\b/i,
  ];
  return patterns.some(p => p.test(text));
}

function categorizeMusicEvent(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('jazz')) return 'jazz';
  if (text.includes('worship') || text.includes('praise') || text.includes('christian')) return 'worship';
  if (text.includes('outdoor') || text.includes('park') || text.includes('plaza') || text.includes('waterfront')) return 'outdoor';
  return 'concert';
}

// =============================================================================
// JSON-LD helper
// =============================================================================

function extractJsonLdEvents($) {
  const events = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const data = JSON.parse(raw.trim());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item && item['@type'] === 'Event') events.push(item);
        if (item && item['@graph']) {
          for (const g of item['@graph']) {
            if (g && g['@type'] === 'Event') events.push(g);
          }
        }
      }
    } catch {
      // ignore invalid JSON
    }
  });
  return events;
}

function parseJsonLdEvent(item, sourceId, scrapedAt) {
  const title = cleanText(stripHtml(item.name || ''));
  if (!title || title.length < 3) return null;

  const startRaw = item.startDate || '';
  const date = parseDate(startRaw.split('T')[0] || startRaw);
  if (!date) return null;

  const timeRaw = startRaw.includes('T') ? startRaw.split('T')[1] : '';
  let time = 'TBD';
  if (timeRaw) {
    const parts = timeRaw.split(':');
    const h = parseInt(parts[0], 10);
    const min = (parts[1] || '00').substring(0, 2);
    if (!isNaN(h)) {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      time = `${h12}:${min} ${period}`;
    }
  }

  const loc = item.location || {};
  const addr = loc.address || {};
  const location = {
    name: cleanText(loc.name || SOURCE_CONFIG[sourceId]?.name || ''),
    address: cleanText(addr.streetAddress || ''),
    city: cleanText(addr.addressLocality || 'Grand Rapids'),
    state: addr.addressRegion || 'MI',
  };

  const description = cleanText(stripHtml(item.description || ''));
  const url = item.url || SOURCE_CONFIG[sourceId]?.url || '';

  return {
    id: generateEventId(sourceId, title, date),
    title,
    description,
    date,
    time,
    startDateTime: toISODateTime(date, time),
    location,
    url,
    source: sourceId,
    category: categorizeMusicEvent(title, description),
    isRecurring: detectRecurringEvent(title, description, ''),
    isFree: detectFreeEvent(title, description, ''),
    scrapedAt,
  };
}

// =============================================================================
// Generic fallback scraper
// =============================================================================

function scrapeGenericEvents($, sourceId, defaultLocation, scrapedAt) {
  const events = [];
  const seen = new Set();

  // Try JSON-LD first
  const jsonLd = extractJsonLdEvents($);
  for (const item of jsonLd) {
    const ev = parseJsonLdEvent(item, sourceId, scrapedAt);
    if (ev && !seen.has(ev.id)) {
      seen.add(ev.id);
      events.push(ev);
    }
  }

  if (events.length > 0) return events;

  // Fallback: event-card selectors
  const eventSelectors = [
    '.event', '.event-item', '.event-card', '[class*="event-"]',
    'article', '.tribe-events-calendar-list__event', '.concert', '.show',
  ];

  let eventElements = $();
  for (const selector of eventSelectors) {
    const found = $(selector).filter((_, el) => {
      return $(el).find('h1, h2, h3, h4, .title').length > 0;
    });
    if (found.length > 0) {
      eventElements = found;
      break;
    }
  }

  eventElements.each((_, el) => {
    const $el = $(el);
    const title = cleanText($el.find('h1, h2, h3, h4, .event-title, .title, .concert-title').first().text());
    if (!title || title.length < 3) return;

    const description = cleanText($el.find('p, .description, .event-description').first().text());
    const dateText = cleanText(
      $el.find('[datetime]').attr('datetime') ||
      $el.find('.date, time, [class*="date"], .event-date').first().text() ||
      ''
    );
    const timeText = cleanText($el.find('.time, [class*="time"]').first().text());
    const link = $el.find('a').first().attr('href') || '';
    const locationText = cleanText($el.find('.location, .venue, [class*="location"]').first().text());

    const date = parseDate(dateText);
    const time = parseTime(timeText);

    if (title && date) {
      const config = SOURCE_CONFIG[sourceId];
      let fullUrl = link;
      if (link && !link.startsWith('http')) {
        const base = new URL(config.url).origin;
        fullUrl = `${base}${link.startsWith('/') ? '' : '/'}${link}`;
      }
      fullUrl = fullUrl || config.url;

      const id = generateEventId(sourceId, title, date);
      if (seen.has(id)) return;
      seen.add(id);

      events.push({
        id,
        title,
        description,
        date,
        time,
        startDateTime: toISODateTime(date, time),
        location: {
          name: locationText || defaultLocation.name,
          address: defaultLocation.address || '',
          city: defaultLocation.city || 'Grand Rapids',
          state: defaultLocation.state || 'MI',
        },
        url: fullUrl,
        source: sourceId,
        category: categorizeMusicEvent(title, description),
        isRecurring: detectRecurringEvent(title, description, timeText),
        isFree: detectFreeEvent(title, description),
        scrapedAt,
      });
    }
  });

  return events;
}

// =============================================================================
// Scrapers
// =============================================================================

async function scrapeLocalSpins() {
  const SOURCE = 'local-spins';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();

    // Local Spins publishes a listicle-style article with concert series entries.
    // Each entry has a bolded series name, venue, and schedule details in <p> tags.
    // Strategy: pull all <p> and <li> text blocks, look for date patterns.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Collect all text blocks from article body
    const articleText = $('article, .entry-content, .post-content, main').first().text();

    // Look for lines that describe a concert series with a day-of-week schedule
    // e.g. "Tuesdays, June 3 – August 26" or "Every Friday beginning June 6"
    const dayOfWeekPatterns = [
      { re: /Tuesdays?[,\s]+(.*?(?:through|through|–|-)\s*[\w\s,]+\d{4})/gi, day: 2 },
      { re: /Wednesdays?[,\s]+(.*?(?:through|–|-)\s*[\w\s,]+\d{4})/gi, day: 3 },
      { re: /Thursdays?[,\s]+(.*?(?:through|–|-)\s*[\w\s,]+\d{4})/gi, day: 4 },
      { re: /Fridays?[,\s]+(.*?(?:through|–|-)\s*[\w\s,]+\d{4})/gi, day: 5 },
      { re: /Saturdays?[,\s]+(.*?(?:through|–|-)\s*[\w\s,]+\d{4})/gi, day: 6 },
      { re: /Sundays?[,\s]+(.*?(?:through|–|-)\s*[\w\s,]+\d{4})/gi, day: 0 },
    ];

    // Walk the article headings / paragraphs looking for series entries
    $('h2, h3, h4, strong, b').each((_, el) => {
      const $el = $(el);
      const seriesName = cleanText($el.text());
      if (!seriesName || seriesName.length < 5 || seriesName.length > 200) return;

      // Get surrounding context (next few siblings)
      let context = '';
      let $curr = $el.parent();
      if ($curr.is('p, li')) {
        context = cleanText($curr.text());
        $curr = $curr.next();
        for (let i = 0; i < 4; i++) {
          if (!$curr.length) break;
          context += ' ' + cleanText($curr.text());
          $curr = $curr.next();
        }
      }

      if (!context) return;

      // Look for a date range in context
      const dateRangeMatch = context.match(
        /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*(?:through|–|-|to)\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})/i
      );

      if (dateRangeMatch) {
        const startMonth = MONTHS[dateRangeMatch[1].toLowerCase()];
        const startDay = dateRangeMatch[2].padStart(2, '0');
        const endMonth = MONTHS[dateRangeMatch[3].toLowerCase()];
        const endDay = dateRangeMatch[4].padStart(2, '0');
        const year = new Date().getFullYear();

        if (!startMonth || !endMonth) return;

        const startDate = `${year}-${startMonth}-${startDay}`;
        const endDate = `${year}-${endMonth}-${endDay}`;

        // Detect day of week from context
        let concertDay = -1;
        if (/tuesday/i.test(context)) concertDay = 2;
        else if (/wednesday/i.test(context)) concertDay = 3;
        else if (/thursday/i.test(context)) concertDay = 4;
        else if (/friday/i.test(context)) concertDay = 5;
        else if (/saturday/i.test(context)) concertDay = 6;
        else if (/sunday/i.test(context)) concertDay = 0;
        else if (/monday/i.test(context)) concertDay = 1;

        // Extract time from context
        const timeMatch = context.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
        const time = timeMatch ? parseTime(timeMatch[1]) : 'TBD';

        // Extract venue from context
        const venueMatch = context.match(/(?:at|@)\s+([A-Z][^,.]+(?:Park|Center|Plaza|Garden|Amphitheater|Amphitheatre|Stage|Grounds|Lawn|Common|Square)?)/);
        const venueName = venueMatch ? cleanText(venueMatch[1]) : 'Grand Rapids';

        // Determine link from parent <a> or nearby links
        let url = config.url;
        const $link = $el.closest('a').first();
        if ($link.length && $link.attr('href')) {
          url = $link.attr('href');
        }

        // If we have a valid start date, create a representative event for the series
        const id = generateEventId(SOURCE, seriesName, startDate);
        if (!seen.has(id)) {
          seen.add(id);
          events.push({
            id,
            title: seriesName,
            description: cleanText(context).substring(0, 500) || `Outdoor concert series running ${startDate} to ${endDate}.`,
            date: startDate,
            time,
            startDateTime: toISODateTime(startDate, time),
            location: {
              name: venueName,
              address: '',
              city: 'Grand Rapids',
              state: 'MI',
            },
            url,
            source: SOURCE,
            category: categorizeMusicEvent(seriesName, context),
            isRecurring: true,
            isFree: detectFreeEvent(seriesName, context),
            scrapedAt,
            seriesEndDate: endDate,
            ...(concertDay >= 0 ? { recurringDayOfWeek: concertDay } : {}),
          });
        }
      } else {
        // Try single-date entry
        const singleDate = parseDate(context);
        if (singleDate) {
          const d = new Date(singleDate);
          if (d < today) return;

          const timeMatch = context.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
          const time = timeMatch ? parseTime(timeMatch[1]) : 'TBD';
          const id = generateEventId(SOURCE, seriesName, singleDate);
          if (!seen.has(id)) {
            seen.add(id);
            events.push({
              id,
              title: seriesName,
              description: cleanText(context).substring(0, 500),
              date: singleDate,
              time,
              startDateTime: toISODateTime(singleDate, time),
              location: {
                name: 'Grand Rapids',
                address: '',
                city: 'Grand Rapids',
                state: 'MI',
              },
              url: config.url,
              source: SOURCE,
              category: categorizeMusicEvent(seriesName, context),
              isRecurring: false,
              isFree: true,
              scrapedAt,
            });
          }
        }
      }
    });

    // Fallback to generic if nothing found
    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, { name: 'Grand Rapids', city: 'Grand Rapids', state: 'MI' }, scrapedAt);
      events.push(...generic);
    }

    console.log(`    Found ${events.length} events from Local Spins`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeDowntownGR() {
  const SOURCE = 'downtown-gr';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Rosa Parks Circle',
    address: 'Campau Square, Monroe Ave NW & Ottawa Ave NW',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49503',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // The Relax at Rosa page is a static announcement article.
    // Try JSON-LD first.
    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length > 0) {
      console.log(`    Found ${events.length} Downtown GR events from JSON-LD`);
      return createScrapeResult(SOURCE, events);
    }

    // Parse the article body for concert dates and performer names
    const articleBody = $('article, .entry-content, .post-content, main, .page-content').first();
    const bodyText = cleanText(articleBody.text());

    // Look for date patterns like "June 3 - Performer Name" or "Tuesday, June 3"
    const dateLinePattern = /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})(?:\s*[–\-]\s*(.+?))?(?:\n|$)/gi;
    let match;
    while ((match = dateLinePattern.exec(bodyText)) !== null) {
      const dateStr = match[1];
      const performer = match[2] ? cleanText(match[2]) : 'Relax at Rosa Concert';
      const date = parseDate(`${dateStr}, ${new Date().getFullYear()}`);
      if (!date) continue;
      const d = new Date(date);
      if (d < today) continue;
      if (!isSummerDate(date)) continue;

      const id = generateEventId(SOURCE, performer || dateStr, date);
      if (seen.has(id)) continue;
      seen.add(id);

      events.push({
        id,
        title: performer || 'Relax at Rosa Concert',
        description: `Free outdoor concert at Rosa Parks Circle in downtown Grand Rapids.`,
        date,
        time: '6:00 PM',
        startDateTime: toISODateTime(date, '6:00 PM'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: true,
        isFree: true,
        scrapedAt,
      });
    }

    // If still nothing, create a placeholder series entry from the article content
    if (events.length === 0) {
      const titleEl = $('h1, h2').first();
      const seriesTitle = cleanText(titleEl.text()) || 'Relax at Rosa Concert Series';
      const description = cleanText($('p').first().text()).substring(0, 500);
      const id = generateEventId(SOURCE, seriesTitle, '2026-06-01');
      events.push({
        id,
        title: seriesTitle,
        description: description || 'Free outdoor summer concert series at Rosa Parks Circle, downtown Grand Rapids.',
        date: '2026-06-01',
        time: '6:00 PM',
        startDateTime: toISODateTime('2026-06-01', '6:00 PM'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: true,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Downtown GR events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeMeijerGardens() {
  const SOURCE = 'meijer-gardens';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Frederik Meijer Gardens & Sculpture Park',
    address: '1000 E Beltline Ave NE',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49525',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try JSON-LD first
    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length > 0) {
      console.log(`    Found ${events.length} Meijer Gardens events from JSON-LD`);
      return createScrapeResult(SOURCE, events);
    }

    // Generic selectors
    const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
    events.push(...generic.filter(e => {
      const d = new Date(e.date);
      return d >= today && isSummerDate(e.date);
    }));

    // If no individual events, create a placeholder series
    if (events.length === 0) {
      const seriesTitle = 'Tuesday Evening Music Club';
      const id = generateEventId(SOURCE, seriesTitle, '2026-06-03');
      events.push({
        id,
        title: seriesTitle,
        description: 'Free outdoor concerts every Tuesday evening at Frederik Meijer Gardens & Sculpture Park. Bring a blanket or lawn chair.',
        date: '2026-06-03',
        time: '6:30 PM',
        startDateTime: toISODateTime('2026-06-03', '6:30 PM'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: true,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Meijer Gardens events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeCoopersvilleFarm() {
  const SOURCE = 'coopersville-farm';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Coopersville Area Historical Society & Museum',
    address: '363 Main St',
    city: 'Coopersville',
    state: 'MI',
    zip: '49404',
  };

  try {
    // The site uses ?redirect=false; try fetching clean
    const url = 'https://www.coopersvillefarmmuseum.org/';
    const html = await fetchHtml(url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try JSON-LD
    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      events.push(...generic.filter(e => {
        const d = new Date(e.date);
        return d >= today;
      }));
    }

    // Placeholder if nothing scraped yet
    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'Coopersville Farm Museum Concert', '2026-06-01');
      events.push({
        id,
        title: 'Coopersville Farm Museum Summer Concerts',
        description: 'Live music at the Coopersville Farm Museum. Check back for the full summer lineup.',
        date: '2026-06-01',
        time: 'TBD',
        startDateTime: toISODateTime('2026-06-01', 'TBD'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'concert',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Coopersville Farm events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeWmJazz() {
  const SOURCE = 'wm-jazz';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Various West Michigan Venues',
    address: '',
    city: 'Grand Rapids',
    state: 'MI',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try JSON-LD
    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      events.push(...generic.filter(e => {
        const d = new Date(e.date);
        return d >= today && isSummerDate(e.date);
      }));
    }

    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'Jazz Around West Michigan', '2026-06-01');
      events.push({
        id,
        title: 'Jazz Around West Michigan',
        description: 'West Michigan jazz events and concert series. Check back for scheduled performances.',
        date: '2026-06-01',
        time: 'TBD',
        startDateTime: toISODateTime('2026-06-01', 'TBD'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'jazz',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} WM Jazz events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeWorshipWaterfront() {
  const SOURCE = 'worship-waterfront';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Ah-Nab-Awen Park (Grand River Waterfront)',
    address: '285 Ah Nab Awen Park',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49504',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Try JSON-LD
    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      events.push(...generic.filter(e => {
        const d = new Date(e.date);
        return d >= today && isSummerDate(e.date);
      }));
    }

    // Look for specific date mentions on the homepage
    if (events.length === 0) {
      const bodyText = cleanText($('body').text());
      const datePattern = /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/gi;
      let match;
      while ((match = datePattern.exec(bodyText)) !== null) {
        const date = parseDate(match[1]);
        if (!date) continue;
        const d = new Date(date);
        if (d < today || !isSummerDate(date)) continue;

        const id = generateEventId(SOURCE, 'Worship on the Waterfront', date);
        if (seen.has(id)) continue;
        seen.add(id);

        events.push({
          id,
          title: 'Worship on the Waterfront',
          description: 'Free outdoor Christian worship concert on the Grand River waterfront.',
          date,
          time: 'TBD',
          startDateTime: toISODateTime(date, 'TBD'),
          location: DEFAULT_LOCATION,
          url: config.url,
          source: SOURCE,
          category: 'worship',
          isRecurring: false,
          isFree: true,
          scrapedAt,
        });
      }
    }

    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'Worship on the Waterfront', '2026-07-01');
      events.push({
        id,
        title: 'Worship on the Waterfront',
        description: 'Free outdoor Christian worship concert on the Grand River waterfront. Check back for the 2026 date.',
        date: '2026-07-01',
        time: 'TBD',
        startDateTime: toISODateTime('2026-07-01', 'TBD'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'worship',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Worship on the Waterfront events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeMaranatha() {
  const SOURCE = 'maranatha';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Maranatha Bible & Missionary Conference',
    address: '4759 Lake Harbor Rd',
    city: 'Norton Shores',
    state: 'MI',
    zip: '49441',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      events.push(...generic.filter(e => {
        const d = new Date(e.date);
        return d >= today && isSummerDate(e.date);
      }));
    }

    // Try finding concert entries in the page
    if (events.length === 0) {
      $('h2, h3, h4, .concert-title, .event-title').each((_, el) => {
        const title = cleanText($(el).text());
        if (!title || title.length < 5) return;

        const $parent = $(el).closest('article, .event, .concert, div').first();
        const context = cleanText($parent.text());
        const date = parseDate(context) || '2026-07-01';
        const d = new Date(date);
        if (d < today) return;

        const timeMatch = context.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
        const time = timeMatch ? parseTime(timeMatch[1]) : 'TBD';
        const id = generateEventId(SOURCE, title, date);
        if (seen.has(id)) return;
        seen.add(id);

        events.push({
          id,
          title,
          description: context.substring(0, 400),
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: DEFAULT_LOCATION,
          url: config.url,
          source: SOURCE,
          category: 'concert',
          isRecurring: false,
          isFree: true,
          scrapedAt,
        });
      });
    }

    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'Maranatha Summer Concert Series', '2026-07-01');
      events.push({
        id,
        title: 'Maranatha Summer Concert Series',
        description: 'Summer concert series at Maranatha Bible & Missionary Conference in Norton Shores, MI. Check back for the full schedule.',
        date: '2026-07-01',
        time: 'TBD',
        startDateTime: toISODateTime('2026-07-01', 'TBD'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'concert',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Maranatha events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeSandyPines() {
  const SOURCE = 'sandy-pines';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Sandy Pines Wilderness Park',
    address: '2745 84th St',
    city: 'Shelbyville',
    state: 'MI',
    zip: '49344',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sandy Pines uses The Events Calendar (WordPress plugin)
    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        if (!ev.location.address) ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      // The Events Calendar recurring events use article.type-tribe_events
      const $articles = $('article.type-tribe_events, .tribe-events-calendar-list__event, article[class*="tribe"]');
      $articles.each((_, el) => {
        const $el = $(el);
        const title = cleanText($el.find('.tribe-event-title, h2, h3, .tribe-events-list-event-title').first().text());
        if (!title) return;

        const dateAttr = $el.find('[datetime]').first().attr('datetime') ||
          $el.find('.tribe-event-date-start').first().text();
        const date = parseDate(dateAttr);
        if (!date) return;
        const d = new Date(date);
        if (d < today) return;

        const timeText = cleanText($el.find('.tribe-event-time, .tribe-event-start-time').first().text());
        const time = parseTime(timeText) || 'TBD';

        const link = $el.find('a').first().attr('href') || config.url;
        const id = generateEventId(SOURCE, title, date);
        if (seen.has(id)) return;
        seen.add(id);

        events.push({
          id,
          title,
          description: `Live music at Sandy Pines Wilderness Park.`,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: DEFAULT_LOCATION,
          url: link.startsWith('http') ? link : config.url,
          source: SOURCE,
          category: 'concert',
          isRecurring: detectRecurringEvent(title, '', ''),
          isFree: false,
          scrapedAt,
        });
      });
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      events.push(...generic.filter(e => {
        const d = new Date(e.date);
        return d >= today;
      }));
    }

    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'Chapel PM Concerts', '2026-05-24');
      events.push({
        id,
        title: 'Chapel PM Concerts at Sandy Pines',
        description: 'Summer concert series at Sandy Pines Wilderness Park. Check back for the full schedule of performers.',
        date: '2026-05-24',
        time: 'TBD',
        startDateTime: toISODateTime('2026-05-24', 'TBD'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'concert',
        isRecurring: true,
        isFree: false,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Sandy Pines events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeDunnebackGirls() {
  const SOURCE = 'dunnebackgirls';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Dunneback & Girls Farm',
    address: '3757 Fruit Ridge Ave NW',
    city: 'Walker',
    state: 'MI',
    zip: '49534',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      // Squarespace-style event blocks
      $('article, .eventlist-event, .eventlist-item').each((_, el) => {
        const $el = $(el);
        const title = cleanText($el.find('h1, h2, h3, .eventlist-title, .entry-title').first().text());
        if (!title || title.length < 3) return;

        const dateText = cleanText(
          $el.find('time').first().attr('datetime') ||
          $el.find('.event-date, .eventlist-datetag, time').first().text()
        );
        const date = parseDate(dateText);
        if (!date) return;

        const d = new Date(date);
        if (d < today) return;

        const timeText = cleanText($el.find('.event-time, .eventlist-time').first().text());
        const time = parseTime(timeText) || 'TBD';

        const link = $el.find('a').first().attr('href') || config.url;
        const id = generateEventId(SOURCE, title, date);
        if (seen.has(id)) return;
        seen.add(id);

        events.push({
          id,
          title,
          description: cleanText($el.find('p').first().text()),
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: DEFAULT_LOCATION,
          url: link.startsWith('http') ? link : `https://www.dunnebackgirls.com${link}`,
          source: SOURCE,
          category: 'concert',
          isRecurring: false,
          isFree: detectFreeEvent(title, $el.text()),
          scrapedAt,
        });
      });
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      events.push(...generic.filter(e => new Date(e.date) >= today));
    }

    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'Dunneback Summer Music', '2026-06-01');
      events.push({
        id,
        title: 'Dunneback & Girls Live Music',
        description: 'Live music and events at Dunneback & Girls Farm in Walker, MI. Check back for upcoming shows.',
        date: '2026-06-01',
        time: 'TBD',
        startDateTime: toISODateTime('2026-06-01', 'TBD'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'concert',
        isRecurring: false,
        isFree: false,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Dunneback & Girls events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeBeaconHill() {
  const SOURCE = 'beacon-hill';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Beacon Hill at Eastgate',
    address: '2161 Monroe Ave NE',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49505',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      // The page likely lists concerts in a table or unordered list
      $('table tr, ul li, .concert-row, .concert-entry, article').each((_, el) => {
        const $el = $(el);
        const text = cleanText($el.text());
        if (!text || text.length < 10) return;

        const date = parseDate(text);
        if (!date) return;
        const d = new Date(date);
        if (d < today) return;

        // Extract performer name (usually the non-date part of the line)
        const cleanedText = text
          .replace(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{0,4}/gi, '')
          .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/, '')
          .trim();
        const title = cleanedText.substring(0, 100) || 'Beacon Hill Concert';

        const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
        const time = timeMatch ? parseTime(timeMatch[1]) : '7:00 PM';

        const id = generateEventId(SOURCE, title, date);
        if (seen.has(id)) return;
        seen.add(id);

        events.push({
          id,
          title: title || 'Beacon Hill Concert',
          description: `Free outdoor concert at Beacon Hill at Eastgate.`,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: DEFAULT_LOCATION,
          url: config.url,
          source: SOURCE,
          category: 'outdoor',
          isRecurring: false,
          isFree: true,
          scrapedAt,
        });
      });
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      events.push(...generic.filter(e => new Date(e.date) >= today));
    }

    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'Beacon Hill 2026 Concert Series', '2026-06-01');
      events.push({
        id,
        title: 'Beacon Hill 2026 Concert Series',
        description: 'Free outdoor summer concert series at Beacon Hill at Eastgate. Check back for the full schedule.',
        date: '2026-06-01',
        time: '7:00 PM',
        startDateTime: toISODateTime('2026-06-01', '7:00 PM'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: true,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Beacon Hill events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeTheStray() {
  const SOURCE = 'stray-cafe';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'The Stray Cafe',
    address: '1415 Wealthy St SE',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49506',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      // Squarespace or similar CMS event list
      const eventSelectors = [
        '.eventlist-event',
        '.eventlist-item',
        'article[class*="event"]',
        '.sqs-events-collection-item',
        '.event-item',
        'article',
      ];

      for (const selector of eventSelectors) {
        const $els = $(selector);
        if ($els.length === 0) continue;

        $els.each((_, el) => {
          const $el = $(el);
          const title = cleanText(
            $el.find('.eventlist-title, h1, h2, h3, .event-title').first().text()
          );
          if (!title || title.length < 3) return;

          const dateText = cleanText(
            $el.find('time').first().attr('datetime') ||
            $el.find('.eventlist-datetag-startdate, .event-date, time').first().text()
          );
          const date = parseDate(dateText);
          if (!date) return;

          const d = new Date(date);
          if (d < today) return;
          if (!isSummerDate(date)) return;

          const timeText = cleanText($el.find('.eventlist-time, .event-time').first().text());
          const time = parseTime(timeText) || 'TBD';

          const link = $el.find('a').first().attr('href') || '';
          const fullUrl = link.startsWith('http') ? link :
            (link ? `https://www.thestraycafe.com${link}` : config.url);

          const id = generateEventId(SOURCE, title, date);
          if (seen.has(id)) return;
          seen.add(id);

          events.push({
            id,
            title,
            description: cleanText($el.find('p, .eventlist-excerpt').first().text()),
            date,
            time,
            startDateTime: toISODateTime(date, time),
            location: DEFAULT_LOCATION,
            url: fullUrl,
            source: SOURCE,
            category: categorizeMusicEvent(title, $el.text()),
            isRecurring: detectRecurringEvent(title, $el.text(), ''),
            isFree: detectFreeEvent(title, $el.text()),
            scrapedAt,
          });
        });

        if (events.length > 0) break;
      }
    }

    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'The Stray Cafe Live Music', '2026-06-01');
      events.push({
        id,
        title: 'Live Music at The Stray Cafe',
        description: 'Live music and events at The Stray Cafe on Wealthy Street, Grand Rapids. Check back for upcoming shows.',
        date: '2026-06-01',
        time: 'TBD',
        startDateTime: toISODateTime('2026-06-01', 'TBD'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'concert',
        isRecurring: false,
        isFree: detectFreeEvent('', ''),
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Stray Cafe events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeFoundersBrewing() {
  const SOURCE = 'founders-brewing';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const DEFAULT_LOCATION = {
    name: 'Founders Brewing Co.',
    address: '235 Grandville Ave SW',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49503',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      const eventSelectors = [
        '.event', '.event-card', '.event-item', '[class*="event"]',
        'article', '.show', '.live-music',
      ];

      for (const selector of eventSelectors) {
        const $els = $(selector);
        if ($els.length === 0) continue;

        $els.each((_, el) => {
          const $el = $(el);
          const title = cleanText($el.find('h2, h3, h4, .title, .event-title').first().text());
          if (!title || title.length < 3) return;

          const dateText = cleanText(
            $el.find('[datetime]').first().attr('datetime') ||
            $el.find('.date, time, [class*="date"]').first().text()
          );
          const date = parseDate(dateText);
          if (!date) return;

          const d = new Date(date);
          if (d < today) return;
          if (!isSummerDate(date)) return;

          const timeText = cleanText($el.find('.time, [class*="time"]').first().text());
          const time = parseTime(timeText) || 'TBD';
          const link = $el.find('a').first().attr('href') || config.url;

          const id = generateEventId(SOURCE, title, date);
          if (seen.has(id)) return;
          seen.add(id);

          events.push({
            id,
            title,
            description: cleanText($el.find('p').first().text()),
            date,
            time,
            startDateTime: toISODateTime(date, time),
            location: DEFAULT_LOCATION,
            url: link.startsWith('http') ? link : config.url,
            source: SOURCE,
            category: categorizeMusicEvent(title, $el.text()),
            isRecurring: false,
            isFree: detectFreeEvent(title, $el.text()),
            scrapedAt,
          });
        });

        if (events.length > 0) break;
      }
    }

    if (events.length === 0) {
      const id = generateEventId(SOURCE, 'Founders Brewing Live Music', '2026-06-01');
      events.push({
        id,
        title: 'Live Music at Founders Brewing',
        description: 'Live music and entertainment at Founders Brewing Co. in Grand Rapids. Check back for upcoming shows.',
        date: '2026-06-01',
        time: 'TBD',
        startDateTime: toISODateTime('2026-06-01', 'TBD'),
        location: DEFAULT_LOCATION,
        url: config.url,
        source: SOURCE,
        category: 'concert',
        isRecurring: false,
        isFree: false,
        scrapedAt,
      });
    }

    console.log(`    Found ${events.length} Founders Brewing events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

// Generic scraper for check-back sources that haven't posted yet
async function scrapeCheckBackSource(sourceId, defaultLocation) {
  const config = SOURCE_CONFIG[sourceId];
  const scrapedAt = new Date().toISOString();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();

    // Try JSON-LD
    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, sourceId, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        if (!ev.location.address) ev.location = { ...defaultLocation };
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, sourceId, defaultLocation, scrapedAt);
      events.push(...generic.filter(e => {
        const d = new Date(e.date);
        return d >= today && isSummerDate(e.date);
      }));
    }

    console.log(`    Found ${events.length} events from ${config.name}`);
    return createScrapeResult(sourceId, events);
  } catch (error) {
    console.log(`    ${config.name}: ${error.message}`);
    return createScrapeResult(sourceId, [], error.message);
  }
}

async function scrapeGilmoreBluewater() {
  return scrapeCheckBackSource('gilmore-bluewater', {
    name: 'Bluewater Grille by Gilmore',
    address: '4437 Breton Rd SE',
    city: 'Kentwood',
    state: 'MI',
    zip: '49508',
  });
}

async function scrapeWmJazzPark() {
  return scrapeCheckBackSource('wm-jazz-park', {
    name: 'Various Parks - West Michigan',
    address: '',
    city: 'Grand Rapids',
    state: 'MI',
  });
}

async function scrapeCorkWine() {
  return scrapeCheckBackSource('cork-wine', {
    name: 'Cork Wine & Grille',
    address: '708 Wealthy St SE',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49506',
  });
}

// =============================================================================
// Geocoding (shared with scrape-events.js geocache)
// =============================================================================

let geocodeCache = {};

async function loadGeoCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    geocodeCache = JSON.parse(data);
  } catch {
    geocodeCache = {};
  }
}

async function saveGeoCache() {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(geocodeCache, null, 2));
  } catch (error) {
    console.error('Failed to save geocode cache:', error);
  }
}

const KNOWN_VENUES = {
  'rosa parks circle': { lat: 42.9687, lng: -85.6714 },
  'rosa parks': { lat: 42.9687, lng: -85.6714 },
  'ah-nab-awen': { lat: 42.9708, lng: -85.6740 },
  'ah nab awen': { lat: 42.9708, lng: -85.6740 },
  'frederik meijer gardens': { lat: 42.9797, lng: -85.5889 },
  'meijer gardens': { lat: 42.9797, lng: -85.5889 },
  'founders brewing': { lat: 42.9565, lng: -85.6739 },
  'founders': { lat: 42.9565, lng: -85.6739 },
  'the stray cafe': { lat: 42.9494, lng: -85.6341 },
  'stray cafe': { lat: 42.9494, lng: -85.6341 },
  'beacon hill at eastgate': { lat: 42.9887, lng: -85.6118 },
  'beacon hill': { lat: 42.9887, lng: -85.6118 },
  'sandy pines': { lat: 42.6328, lng: -85.7253 },
  'dunneback': { lat: 43.0125, lng: -85.7253 },
  'coopersville': { lat: 43.0651, lng: -85.9266 },
  'maranatha': { lat: 43.1753, lng: -86.2717 },
  'bluewater grille': { lat: 42.8773, lng: -85.5936 },
  'the score gr': { lat: 43.0142, lng: -85.6462 },
  'score restaurant': { lat: 43.0142, lng: -85.6462 },
};

function getKnownVenueCoords(venueName) {
  const normalized = venueName.toLowerCase().trim();
  for (const [name, coords] of Object.entries(KNOWN_VENUES)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return coords;
    }
  }
  return null;
}

async function geocodeAddress(address, city, state = 'MI') {
  await loadGeoCache();

  const cacheKey = `${address}|${city}|${state}`.toLowerCase().trim();
  if (cacheKey in geocodeCache) {
    return geocodeCache[cacheKey];
  }

  const query = [address, city, state, 'USA'].filter(Boolean).join(', ');

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'GRSummerMusic/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Nominatim API error: ${response.status}`);

    const data = await response.json();
    if (data.length === 0) {
      geocodeCache[cacheKey] = null;
      await saveGeoCache();
      return null;
    }

    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    geocodeCache[cacheKey] = result;
    await saveGeoCache();
    return result;
  } catch (error) {
    console.error(`Geocoding error for "${query}":`, error.message);
    return null;
  }
}

async function geocodeEvent(event) {
  if (event.location.lat && event.location.lng) return event;

  const knownCoords = getKnownVenueCoords(event.location.name);
  if (knownCoords) {
    return { ...event, location: { ...event.location, ...knownCoords } };
  }

  const result = await geocodeAddress(event.location.address, event.location.city, event.location.state);
  if (result) {
    return { ...event, location: { ...event.location, lat: result.lat, lng: result.lng } };
  }

  const cityResult = await geocodeAddress('', event.location.city, event.location.state);
  if (cityResult) {
    return { ...event, location: { ...event.location, lat: cityResult.lat, lng: cityResult.lng } };
  }

  return event;
}

async function geocodeEvents(events, onProgress) {
  const geocodedEvents = [];
  let apiCalls = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const needsApiCall = !event.location.lat && !event.location.lng &&
      !getKnownVenueCoords(event.location.name);

    const geocodedEvent = await geocodeEvent(event);
    geocodedEvents.push(geocodedEvent);

    if (onProgress) onProgress(i + 1, events.length);

    if (needsApiCall && i < events.length - 1) {
      apiCalls++;
      await delay(1500);
    }
  }

  console.log(`  Geocoding complete: ${apiCalls} API calls made`);
  return geocodedEvents;
}

// =============================================================================
// The Score GR
// =============================================================================

async function scrapeScoreGR() {
  const SOURCE = 'score-gr';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();

  const LOCATION = {
    name: 'The Score Restaurant & Sports Bar',
    address: '5301 Northland Dr NE',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49525',
    lat: 43.0142,
    lng: -85.6462,
  };

  // The Score uses The Events Calendar (WordPress) with a monthly calendar view.
  // cat_ids~243 filters to Live Music only. We pass a mid-month timestamp so
  // timezone offsets never push us into the wrong month.
  function monthTimestamp(year, month) {
    // Noon UTC on the 15th — safely within any month regardless of timezone.
    return Math.floor(Date.UTC(year, month - 1, 15, 12, 0, 0) / 1000);
  }

  // Build monthly URLs for May through September of the current (or upcoming) year
  function buildMonthUrls() {
    const now = new Date();
    const year = now.getFullYear();
    // If we're past September, use next year's summer
    const targetYear = now.getMonth() >= 9 ? year + 1 : year;
    const urls = [];
    for (let month = 5; month <= 9; month++) {
      const ts = monthTimestamp(targetYear, month);
      urls.push({
        url: `https://www.thescoregr.com/event-calendar/action~month/exact_date~${ts}/cat_ids~243/`,
        year: targetYear,
        month,
      });
    }
    return urls;
  }

  // Strip emoji characters and normalize whitespace from event title link text.
  // The calendar renders titles as "  ☀️ Oxymorons Duo  12:00 pm " (first link)
  // or "Oxymorons Duo" (second/title-only link). We use the title-only form.
  function cleanEventTitle(raw) {
    return raw
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // strip emoji
      .replace(/\s*\d{1,2}:\d{2}\s*(am|pm)\s*$/i, '') // strip trailing time
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Parse "Jun 1 @ 6:00 pm – 10:00 pm" → { date: '2026-06-01', time: '6:00 PM' }
  function parseTribeDateTime(text, year) {
    const m = text.match(
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2})\s*@\s*(\d{1,2}:\d{2}\s*(?:am|pm))/i
    );
    if (!m) return null;
    const month = MONTHS[m[1].toLowerCase()];
    if (!month) return null;
    const day = m[2].padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    const time = parseTime(m[3]);
    return { date, time };
  }

  try {
    const monthUrls = buildMonthUrls();
    const events = [];
    const seen = new Set(); // dedupe by instance URL
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const { url, year, month } of monthUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = loadHtml(html);

        // Each event is an <article> with class matching tribe_events_cat-live-music.
        // Selector covers both the category-scoped class and the generic type class.
        const $articles = $(
          'article.tribe_events_cat-live-music, article.type-tribe_events'
        );

        $articles.each((_, el) => {
          const $el = $(el);

          // Title: prefer the dedicated event-title heading link (cleanest text).
          // Fall back to the first <a href*="/event/"> found in the article.
          let titleRaw = cleanText(
            $el.find('.tribe-events-list-event-title a, h2.tribe-events-list-event-title a').first().text() ||
            $el.find('h2 a, h3 a').first().text() ||
            $el.find('a[href*="/event/"][href*="instance_id"]').first().text()
          );
          const title = cleanEventTitle(titleRaw);
          if (!title || title.length < 2) return;

          // Event URL
          let href = $el.find('.tribe-events-list-event-title a, h2 a, a[href*="/event/"]').first().attr('href') || '';
          if (href && !href.startsWith('http')) {
            href = `https://www.thescoregr.com${href.startsWith('/') ? '' : '/'}${href}`;
          }

          // Deduplicate by instance URL
          if (seen.has(href)) return;
          seen.add(href);

          // Date + time from the schedule block: "Jun 1 @ 6:00 pm – 10:00 pm"
          const scheduleText = cleanText(
            $el.find('.tribe-events-schedule, [class*="schedule"], .tribe-event-time').first().text() ||
            $el.text()
          );
          const parsed = parseTribeDateTime(scheduleText, year);
          if (!parsed) return;

          const { date, time } = parsed;
          const eventDate = new Date(date);
          if (eventDate < today) return;

          // Description from excerpt or first paragraph
          const description = cleanText(
            $el.find('.tribe-events-list-event-description p, .tribe-excerpt p, p').first().text()
          ) || 'Free live music at The Score Restaurant & Sports Bar.';

          events.push({
            id: generateEventId(SOURCE, title, date),
            title,
            description,
            date,
            time,
            startDateTime: toISODateTime(date, time),
            location: { ...LOCATION },
            url: href || config.url,
            source: SOURCE,
            category: 'concert',
            isRecurring: false,
            isFree: detectFreeEvent(title, description, scheduleText),
            scrapedAt,
          });
        });

        // Fallback: if the monthly calendar renders a flat list instead of articles,
        // look for event links directly in the calendar cells (td elements).
        if ($articles.length === 0) {
          const seenHrefs = new Set();
          $('td a[href*="/event/"][href*="instance_id"]').each((_, a) => {
            const $a = $(a);
            let href = $a.attr('href') || '';
            if (!href.startsWith('http')) {
              href = `https://www.thescoregr.com${href.startsWith('/') ? '' : '/'}${href}`;
            }
            if (seenHrefs.has(href)) return;
            seenHrefs.add(href);

            const titleRaw = cleanEventTitle(cleanText($a.text()));
            if (!titleRaw || titleRaw.length < 2) return;

            // Date lives in the parent <td> text
            const cellText = cleanText($a.closest('td').text());
            const parsed = parseTribeDateTime(cellText, year);
            if (!parsed) return;

            const { date, time } = parsed;
            const eventDate = new Date(date);
            if (eventDate < today) return;

            const id = generateEventId(SOURCE, titleRaw, date);
            if (seen.has(id)) return;
            seen.add(id);

            events.push({
              id,
              title: titleRaw,
              description: 'Free live music at The Score Restaurant & Sports Bar.',
              date,
              time,
              startDateTime: toISODateTime(date, time),
              location: { ...LOCATION },
              url: href,
              source: SOURCE,
              category: 'concert',
              isRecurring: false,
              isFree: true,
              scrapedAt,
            });
          });
        }

        console.log(`    The Score GR: ${events.length} events after ${month}/${year}`);
        await delay(1000);
      } catch (monthErr) {
        console.log(`    The Score GR: skipped month ${month}/${year} — ${monthErr.message}`);
      }
    }

    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

// =============================================================================
// Main Scrape Function
// =============================================================================

async function runFullScrape() {
  const scrapers = [
    { name: 'Local Spins', fn: scrapeLocalSpins },
    { name: 'Downtown GR', fn: scrapeDowntownGR },
    { name: 'Meijer Gardens', fn: scrapeMeijerGardens },
    { name: 'Coopersville Farm Museum', fn: scrapeCoopersvilleFarm },
    { name: 'WM Jazz', fn: scrapeWmJazz },
    { name: 'Worship on the Waterfront', fn: scrapeWorshipWaterfront },
    { name: 'Maranatha Michigan', fn: scrapeMaranatha },
    { name: 'Sandy Pines', fn: scrapeSandyPines },
    { name: 'Dunneback & Girls', fn: scrapeDunnebackGirls },
    { name: 'Beacon Hill', fn: scrapeBeaconHill },
    { name: 'The Stray Cafe', fn: scrapeTheStray },
    { name: 'Founders Brewing', fn: scrapeFoundersBrewing },
    { name: 'Gilmore Bluewater', fn: scrapeGilmoreBluewater },
    { name: 'WM Jazz in the Park', fn: scrapeWmJazzPark },
    { name: 'Cork Wine & Grille', fn: scrapeCorkWine },
    { name: 'The Score GR', fn: scrapeScoreGR },
  ];

  const results = [];
  const allEvents = [];
  const sources = {};

  for (const scraper of scrapers) {
    console.log(`Scraping ${scraper.name}...`);

    const result = await scraper.fn();
    results.push(result);

    if (result.success) {
      console.log(`  ✓ ${result.events.length} events found`);
      allEvents.push(...result.events);
    } else {
      console.log(`  ✗ Error: ${result.error}`);
    }

    const sourceConfig = SOURCE_CONFIG[result.source];
    sources[result.source] = {
      ...sourceConfig,
      eventCount: result.events.length,
      lastScraped: result.scrapedAt,
    };

    await delay(1000);
  }

  // Deduplicate by id
  const uniqueEvents = Array.from(
    new Map(allEvents.map(event => [event.id, event])).values()
  );

  // Sort by date
  uniqueEvents.sort((a, b) => {
    return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
  });

  return { events: uniqueEvents, sources, results };
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   GR Summer Music - Scraper           ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');

  const forceRun = process.argv.includes('--force');

  if (!forceRun) {
    try {
      const existingData = await fs.readFile(DATA_FILE, 'utf-8');
      const { lastScraped } = JSON.parse(existingData);

      if (lastScraped) {
        const hoursSinceLastScrape = (Date.now() - new Date(lastScraped)) / (1000 * 60 * 60);

        if (hoursSinceLastScrape < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastScrape);
          console.log(`⏳ Last scrape was ${Math.floor(hoursSinceLastScrape)} hours ago.`);
          console.log(`   Next scrape allowed in ~${hoursRemaining} hour(s).`);
          console.log('');
          console.log('   Use --force flag to override: node scripts/scrape-summer-music.js --force');
          process.exit(0);
        }
      }
    } catch {
      // No existing data, proceed
    }
  } else {
    console.log('⚠️  Force flag detected - bypassing 24-hour limit');
    console.log('');
  }

  try {
    console.log('Starting scrape...');
    console.log('');

    const { events, sources, results } = await runFullScrape();

    console.log('');
    console.log(`Total: ${events.length} unique events from ${Object.keys(sources).length} sources`);
    console.log('');

    console.log('Geocoding events...');
    const geocodedEvents = await geocodeEvents(events, (completed, total) => {
      if (completed % 10 === 0 || completed === total) {
        process.stdout.write(`  Progress: ${completed}/${total}\r`);
      }
    });
    console.log('');

    const data = {
      events: geocodedEvents,
      lastScraped: new Date().toISOString(),
      sources,
    };

    console.log('Saving to src/data/summer-music-events.json...');
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));

    console.log('');
    console.log('✓ Scrape complete!');
    console.log(`  Events: ${data.events.length}`);
    console.log(`  File: ${DATA_FILE}`);

  } catch (error) {
    console.error('');
    console.error('✗ Scrape failed:', error.message);
    process.exit(1);
  }
}

main();
