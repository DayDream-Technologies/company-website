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
  'saugatuck-mitp': {
    id: 'saugatuck-mitp',
    name: 'Saugatuck — Music in the Park',
    url: 'https://saugatuck.com/event/music-in-the-park/',
    color: '#00897B',
  },
  'sparta-park-concerts': {
    id: 'sparta-park-concerts',
    name: 'Sparta Summer Concerts (Chamber)',
    url: 'https://www.spartachamber.com/sparta-park-concerts',
    color: '#5D4037',
  },
  'kentwood-summer-concerts': {
    id: 'kentwood-summer-concerts',
    name: 'Kentwood Summer Concert Series',
    url: 'https://www.kentwood.us/events_detail_T53_R64.php',
    color: '#455A64',
  },
  'eastgr-concerts-park': {
    id: 'eastgr-concerts-park',
    name: 'East GR — Concerts in the Park',
    url: 'https://www.eastgrmi.gov/181/Concerts-In-The-Park',
    color: '#00695C',
  },
  'lowell-sizzlin': {
    id: 'lowell-sizzlin',
    name: 'Lowell — Sizzlin’ Summer Concerts',
    url: 'https://www.discoverlowell.org/sizzlin-summer-concerts/',
    color: '#C62828',
  },
  'grandhaven-free-fridays': {
    id: 'grandhaven-free-fridays',
    name: 'Grand Haven Free Fridays',
    url: 'https://www.grandhavenfreefridays.com/events',
    color: '#0277BD',
  },
  'muskegon-city-tagged': {
    id: 'muskegon-city-tagged',
    name: 'City of Muskegon (tagged events)',
    url: 'https://muskegon-mi.gov/events/list/?tribe-bar-date=2026-06-01&tribe_tags%5B0%5D=702',
    color: '#1565C0',
  },
  'visit-muskegon-concerts': {
    id: 'visit-muskegon-concerts',
    name: 'Visit Muskegon — Concerts & Live Music',
    url: 'https://www.visitmuskegon.org/events/concerts-live-music/',
    color: '#4527A0',
  },
  'ada-parks-summer-concerts': {
    id: 'ada-parks-summer-concerts',
    name: 'Ada Township — Summer Concerts (Legacy Park)',
    url:
      'https://www.adamichigan.org/departments/parks_recreation_land_preservation/community___special_events.php',
    color: '#558B2F',
  },
  'caledonia-concert-series': {
    id: 'caledonia-concert-series',
    name: 'Caledonia Community Green Park',
    url: 'https://www.instagram.com/p/DX8B2FERAbM/',
    color: '#6A1B9A',
  },
  'wyoming-concerts-park': {
    id: 'wyoming-concerts-park',
    name: 'Wyoming — Concerts in the Park',
    url: 'https://www.wyomingmi.gov/concerts',
    color: '#283593',
  },
  'rockford-rogue-blues': {
    id: 'rockford-rogue-blues',
    name: 'Rockford — Rogue River Blues Series',
    url: 'https://www.rockford.mi.us/news_detail_T7_R459.php',
    color: '#4E342E',
  },
};

const LOCAL_SPINS_2026_GUIDE_URL = 'https://localspins.com/free-outdoor-community-concerts-2026/';

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

function decodeHtmlEntities(str) {
  if (!str) return '';
  try {
    const $ = loadHtml('<div></div>');
    $('div').html(String(str));
    return $('div').text();
  } catch {
    return String(str)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Decode entities, strip tags, normalize whitespace (for JSON-LD / CMS descriptions). */
function cleanDescription(raw) {
  if (!raw) return '';
  const decoded = decodeHtmlEntities(String(raw).replace(/\\n/g, ' '));
  return cleanText(stripHtml(decoded));
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
  if (text.includes('worship') || text.includes('praise') || text.includes('christian')) return 'faith based';
  if (text.includes('outdoor') || text.includes('park') || text.includes('plaza') || text.includes('waterfront')) return 'outdoor';
  return 'concert';
}

/** Parse "June 16 – Artist Name" / "June 16 - Artist" blocks (Local Spins style). */
function parseMonthDayArtistLineup(text, year) {
  const events = [];
  const trimmed = trimLocalSpinsLineupBlock(text);
  const re =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*[–\-]\s*([^]+?)(?=\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\s*[–\-]|$)/gi;
  let m;
  while ((m = re.exec(trimmed)) !== null) {
    const month = MONTHS[m[1].toLowerCase()];
    if (!month) continue;
    const day = m[2].padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    let title = cleanText(m[3]);
    if (!title || title.length < 2 || title.length > 80) continue;
    if (/^when:\s*/i.test(title) || /where:\s*/i.test(title)) continue;
    events.push({ date, title });
  }
  return events;
}

/** Stop lineup text before the next all-caps series header in the Local Spins guide. */
function trimLocalSpinsLineupBlock(lineup) {
  const nextSeries = lineup.match(/\s+[A-Z][A-Z0-9\s&'’]+:\s+[A-Z]/);
  if (nextSeries && nextSeries.index > 15) {
    return lineup.slice(0, nextSeries.index);
  }
  const dashBreak = lineup.search(/\s+---\s+/);
  if (dashBreak > 15) return lineup.slice(0, dashBreak);
  return lineup.slice(0, 700);
}

/** Extract a Local Spins 2026 guide section (e.g. "CALEDONIA CONCERT SERIES"). */
async function fetchLocalSpins2026Section(sectionMarker) {
  const html = await fetchHtml(LOCAL_SPINS_2026_GUIDE_URL);
  const text = cleanText(loadHtml(html)('body').text());
  const idx = text.indexOf(sectionMarker);
  if (idx < 0) return null;
  const chunk = text.slice(idx, idx + 2500);
  const lineupIdx = chunk.search(/LINEUP:?\s*/i);
  if (lineupIdx < 0) return null;
  const lineup = chunk.slice(lineupIdx).replace(/^LINEUP:?\s*/i, '');
  return trimLocalSpinsLineupBlock(lineup);
}

function buildMusicEvent({
  sourceId,
  title,
  date,
  time,
  description,
  location,
  url,
  scrapedAt,
  isRecurring = false,
}) {
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
    isRecurring,
    isFree: detectFreeEvent(title, description, ''),
    scrapedAt,
  };
}

function extractAdaCommunityMusicBlocks($) {
  const blocks = [];
  $('h2').each((_, el) => {
    const title = cleanText($(el).text());
    if (!title || title.length < 3) return;
    if (!/music on the lawn|beers at the bridge|4th of july/i.test(title)) return;
    const $block = $(el).nextUntil('h2');
    const blockText = cleanText($block.text());
    let eventUrl = 'https://www.adamichigan.org/community/events.php';
    $block.find('a[href]').each((__, a) => {
      const href = $(a).attr('href') || '';
      if (!href || href.startsWith('tel:') || href.startsWith('mailto:')) return;
      if (/\.pdf$/i.test(href) || /read more|click here/i.test(cleanText($(a).text()))) {
        eventUrl = href.startsWith('http')
          ? href
          : `https://www.adamichigan.org${href.startsWith('/') ? '' : '/'}${href}`;
      }
    });
    blocks.push({ title, blockText, eventUrl });
  });
  return blocks;
}

function parseAdaMusicOnTheLawnDates(blockText, year) {
  const concertDates = blockText.match(/Concert\s+Dates:\s*([^.]+)/i);
  if (!concertDates) return [];
  const rawParts = concertDates[1].split(/,\s*/).map((s) => s.trim()).filter(Boolean);
  const dates = [];
  let lastMonth = '';
  for (const part of rawParts) {
    const monthMatch = part.match(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)/i
    );
    if (monthMatch) lastMonth = monthMatch[1];
    const dayOnly = part.match(/^(\d{1,2})$/);
    const candidate =
      dayOnly && lastMonth ? `${lastMonth} ${dayOnly[1]}, ${year}` : `${part}, ${year}`;
    const parsed = parseDate(candidate);
    if (parsed) dates.push(parsed);
  }
  return dates;
}

function extractTownshipDatesFromText(text, year) {
  const dates = new Set();
  const explicitRe =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})(?!\d)/gi;
  let em;
  while ((em = explicitRe.exec(text)) !== null) {
    const m = MONTHS[em[1].toLowerCase()];
    if (m) dates.add(`${em[3]}-${m}-${em[2].padStart(2, '0')}`);
  }
  const ordinalRe =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)\b/gi;
  while ((em = ordinalRe.exec(text)) !== null) {
    const m = MONTHS[em[1].toLowerCase()];
    if (m) dates.add(`${year}-${m}-${em[2].padStart(2, '0')}`);
  }
  return [...dates];
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
  const title = cleanText(cleanDescription(item.name || ''));
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

  const description = cleanDescription(item.description || '');
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

const MONTH_ABBR = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  sept: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

function parseMecOccurrenceParam(url) {
  if (!url) return null;
  const m = url.match(/[?&]occurrence=([^&]+)/i);
  if (!m) return null;
  const raw = decodeURIComponent(m[1]);
  const dateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return null;
  const date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  let time = '7:00 PM';
  const timeMatch = raw.match(/T(\d{2}):(\d{2})/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    const min = timeMatch[2];
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    time = `${h12}:${min} ${period}`;
  }
  return { date, time };
}

function parseMecDateFromElement($, $el) {
  const occUrl =
    $el.find('a[href*="occurrence="]').first().attr('href') ||
    $el.attr('href') ||
    '';
  const fromOcc = parseMecOccurrenceParam(occUrl);
  if (fromOcc) return fromOcc;

  const datetime = $el.find('[datetime]').first().attr('datetime');
  if (datetime) {
    const date = parseDate(datetime.split('T')[0] || datetime);
    if (date) {
      let time = '7:00 PM';
      if (datetime.includes('T')) {
        const tm = datetime.match(/T(\d{2}):(\d{2})/);
        if (tm) {
          const h = parseInt(tm[1], 10);
          const period = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 || 12;
          time = `${h12}:${tm[2]} ${period}`;
        }
      }
      return { date, time };
    }
  }

  const dateBlock = cleanText($el.find('.mec-event-date, .mec-date-details, .mec-event-detail').first().text()) ||
    cleanText($el.text());
  const longMatch = dateBlock.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
  );
  if (longMatch) {
    const month = MONTHS[longMatch[1].toLowerCase()];
    if (month) {
      return {
        date: `${longMatch[3]}-${month}-${longMatch[2].padStart(2, '0')}`,
        time: '7:00 PM',
      };
    }
  }

  const abbrMatch = dateBlock.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b/i);
  if (abbrMatch) {
    const month = MONTH_ABBR[abbrMatch[2].toLowerCase()];
    if (month) {
      const year = new Date().getFullYear();
      return {
        date: `${year}-${month}-${abbrMatch[1].padStart(2, '0')}`,
        time: '7:00 PM',
      };
    }
  }

  return null;
}

function isMecEventExpired($, $el) {
  if ($el.hasClass('mec-past') || $el.hasClass('mec-event-expired')) return true;
  if ($el.closest('.mec-past-wrap, .mec-past-event').length) return true;
  const label = cleanText($el.find('.mec-event-status, .mec-label').text());
  if (/expired|cancelled|canceled/i.test(label)) return true;
  if (/\bexpired\b/i.test(cleanText($el.find('.mec-event-title').text()))) return true;
  return false;
}

function parseMeijerMecEventArticle($, el, sourceId, defaultLocation, scrapedAt, pageUrl) {
  const $el = $(el);
  if (isMecEventExpired($, $el)) return null;

  const title = cleanText(
    $el.find('h4.mec-event-title a, h3.mec-event-title a, .mec-event-title a').first().text() ||
      $el.find('h4.mec-event-title, .mec-event-title').first().text()
  );
  if (!title || title.length < 2 || /^expired$/i.test(title)) return null;

  let url =
    $el.find('h4.mec-event-title a, .mec-event-title a, a[href*="/events/"]').first().attr('href') ||
    pageUrl;
  if (url && !url.startsWith('http')) {
    url = `https://www.meijergardens.org${url.startsWith('/') ? '' : '/'}${url}`;
  }

  const parsed = parseMecDateFromElement($, $el);
  if (!parsed) return null;

  let time = parsed.time;
  const timeText = cleanText($el.find('.mec-time-details, .mec-event-time, .mec-event-detail').text());
  const timeMatch = timeText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/);
  if (timeMatch) time = parseTime(timeMatch[1]);

  const description =
    'Tuesday Evening Music Club at Frederik Meijer Gardens Amphitheater. Gates open at 5 p.m.; performance at 7 p.m. Free for members, included with admission for guests.';

  return buildMusicEvent({
    sourceId,
    title,
    date: parsed.date,
    time,
    description,
    location: { ...defaultLocation },
    url,
    scrapedAt,
  });
}

/**
 * Modern Events Calendar (MEC) list on the Tuesday Evening Music Club page.
 * The featured/next show lives in .mec-topsec and must stay first in the results.
 */
function parseMeijerGardensMecEvents($, sourceId, defaultLocation, scrapedAt, pageUrl) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const events = [];
  const seen = new Set();

  function tryPush(el, fromTopsec) {
    const ev = parseMeijerMecEventArticle($, el, sourceId, defaultLocation, scrapedAt, pageUrl);
    if (!ev || seen.has(ev.id)) return;
    const eventDate = new Date(`${ev.date}T12:00:00`);
    if (eventDate < today) return;
    if (!isSummerDate(ev.date)) return;
    seen.add(ev.id);
    events.push({ ...ev, _fromTopsec: fromTopsec });
  }

  $('.mec-topsec .mec-event-article, .mec-topsec article.mec-event-article').each((_, el) => {
    tryPush(el, true);
  });

  if (events.length === 0) {
    $('.mec-topsec')
      .find('a[href*="occurrence="]')
      .each((_, a) => {
        const $a = $(a);
        const $article = $a.closest('article.mec-event-article, .mec-event-article');
        tryPush($article.length ? $article[0] : a, true);
      });
  }

  $('.mec-event-article, article.mec-event-article').each((_, el) => {
    if ($(el).closest('.mec-topsec').length) return;
    tryPush(el, false);
  });

  $('a[href*="/events/"][href*="occurrence="]').each((_, a) => {
    const $a = $(a);
    if ($a.closest('.mec-topsec').length) return;
    const $article = $a.closest('article.mec-event-article, .mec-event-article');
    if ($article.length) return;
    tryPush(a, false);
  });

  const topsec = events.filter((e) => e._fromTopsec);
  const rest = events
    .filter((e) => !e._fromTopsec)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  return [...topsec, ...rest].map(({ _fromTopsec, ...ev }) => ev);
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

  const SERIES_DESCRIPTION =
    'Tuesday Evening Music Club at Frederik Meijer Gardens Amphitheater. Gates open at 5 p.m.; performances at 7 p.m.';

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const seen = new Set();
    let events = [];

    const mecEvents = parseMeijerGardensMecEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt, config.url);
    for (const ev of mecEvents) {
      if (!seen.has(ev.id)) {
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (mecEvents.length > 0) {
      console.log(
        `    Meijer Gardens: ${mecEvents.length} events from MEC calendar (.mec-topsec first: "${mecEvents[0].title}")`
      );
    }

    const jsonLdItems = extractJsonLdEvents($);
    for (const item of jsonLdItems) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && !seen.has(ev.id)) {
        ev.location = { ...DEFAULT_LOCATION };
        if (!ev.description) ev.description = SERIES_DESCRIPTION;
        const eventDate = new Date(`${ev.date}T12:00:00`);
        if (eventDate >= today && isSummerDate(ev.date)) {
          seen.add(ev.id);
          events.push(ev);
        }
      }
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      for (const ev of generic) {
        if (!seen.has(ev.id)) {
          const eventDate = new Date(`${ev.date}T12:00:00`);
          if (eventDate >= today && isSummerDate(ev.date)) {
            seen.add(ev.id);
            events.push(ev);
          }
        }
      }
    }

    if (events.length === 0) {
      const seriesTitle = 'Tuesday Evening Music Club';
      events.push(
        buildMusicEvent({
          sourceId: SOURCE,
          title: seriesTitle,
          date: '2026-06-02',
          time: '7:00 PM',
          description: SERIES_DESCRIPTION,
          location: DEFAULT_LOCATION,
          url: config.url,
          scrapedAt,
          isRecurring: true,
        })
      );
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
          category: 'faith based',
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
        category: 'faith based',
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
        ev.description = cleanDescription(item.description || ev.description);
        ev.category = 'faith based';
        seen.add(ev.id);
        events.push(ev);
      }
    }

    if (events.length === 0) {
      const generic = scrapeGenericEvents($, SOURCE, DEFAULT_LOCATION, scrapedAt);
      events.push(...generic.filter(e => {
        const d = new Date(e.date);
        return d >= today && isSummerDate(e.date);
      }).map(e => ({
        ...e,
        description: cleanDescription(e.description),
        category: 'faith based',
      })));
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
          description: cleanDescription(context).substring(0, 400),
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: DEFAULT_LOCATION,
          url: config.url,
          source: SOURCE,
          category: 'faith based',
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
        category: 'faith based',
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

  // Chapel PM concerts — shared venue/time from the schedule block above the lineup.
  const CHAPEL_LOCATION = {
    name: 'Sandy Pines Chapel',
    address: '3630 26th Ave',
    city: 'Dorr',
    state: 'MI',
    zip: '49323',
  };

  // "May 24 | Phil Cross and Poet Voices"
  const SCHEDULE_LINE_RE =
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*\|\s*(.+)$/i;

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();

    // Shared time/address from the page intro (not from the Upcoming Events widget).
    const introText = cleanText(
      $('.wpb_text_column').first().text() ||
      $('article.tribe_events').first().text() ||
      $('body').text()
    );

    let time = '6:00 PM';
    const concertTimeMatch = introText.match(/Concerts begin at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    if (concertTimeMatch) {
      time = parseTime(concertTimeMatch[1]);
    }

    const gateOpenMatch = introText.match(/Gate Opens[^.]*at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    const gateTime = gateOpenMatch ? parseTime(gateOpenMatch[1]) : null;

    const descriptionParts = [
      'Chapel PM concert at Sandy Pines.',
      gateTime ? `Chapel gate opens at ${gateTime}.` : 'Chapel gate opens at 5:00 PM.',
      `Concerts begin at ${time}.`,
      'Free will offering; lawn chairs recommended. No tickets required.',
    ];

    // Sunday PM Concert Schedule: h3 lines in WPB content only (ignore tribe widget lists).
    $('h3').each((_, el) => {
      const line = cleanText($(el).text());
      const match = line.match(SCHEDULE_LINE_RE);
      if (!match) return;

      const month = MONTHS[match[1].toLowerCase()];
      if (!month) return;

      const day = match[2].padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      const title = cleanText(match[3]);
      if (!title) return;

      const eventDate = new Date(`${date}T12:00:00`);
      if (eventDate < today) return;

      const id = generateEventId(SOURCE, title, date);
      if (seen.has(id)) return;
      seen.add(id);

      // Optional per-show blurb in the next <p> sibling within the same column.
      const $column = $(el).closest('.wpb_text_column, .wpb_wrapper');
      const blurb = cleanText($column.find('p').first().text());
      const description = blurb && blurb.length > 20 && !SCHEDULE_LINE_RE.test(blurb)
        ? `${descriptionParts.join(' ')} ${blurb.substring(0, 400)}`
        : descriptionParts.join(' ');

      events.push({
        id,
        title,
        description,
        date,
        time,
        startDateTime: toISODateTime(date, time),
        location: { ...CHAPEL_LOCATION },
        url: config.url,
        source: SOURCE,
        category: 'concert',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    });

    console.log(`    Found ${events.length} Sandy Pines Chapel PM concerts`);
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
  'sandy pines chapel': { lat: 42.6258, lng: -85.7524 },
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

/** Tribe Events Calendar list view: "July 7 @ 7:00 pm" */
function parseTribeListDateTimeSpan(text, year) {
  const m = cleanText(text).match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2})\s*@\s*(\d{1,2}:\d{2}\s*(?:am|pm))/i
  );
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (!month) return null;
  const day = m[2].padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: parseTime(m[3]) };
}

function addWednesdaySeries(events, SOURCE, scrapedAt, startDateStr, endDateStr, titleBase, description, location, url, timeStr) {
  const seen = new Set(events.map((e) => e.id));
  const time = parseTime(timeStr);
  let d = new Date(startDateStr + 'T12:00:00');
  const end = new Date(endDateStr + 'T12:00:00');
  while (d <= end) {
    if (d.getDay() === 3) {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const date = `${y}-${mo}-${da}`;
      const id = generateEventId(SOURCE, titleBase, date);
      if (!seen.has(id)) {
        seen.add(id);
        events.push({
          id,
          title: titleBase,
          description,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: { ...location },
          url,
          source: SOURCE,
          category: 'outdoor',
          isRecurring: false,
          isFree: true,
          scrapedAt,
        });
      }
    }
    d.setDate(d.getDate() + 1);
  }
}

async function scrapeSaugatuckMusicPark() {
  const SOURCE = 'saugatuck-mitp';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const LOC = {
    name: 'Wicks Park',
    address: '452 Water St',
    city: 'Saugatuck',
    state: 'MI',
    zip: '49453',
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const html = await fetchHtml(config.url);
    if (/blocked|cf-error-details/i.test(html)) {
      throw new Error('blocked');
    }
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();
    for (const item of extractJsonLdEvents($)) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && new Date(ev.date) >= today && isSummerDate(ev.date)) {
        ev.location = { ...LOC, ...ev.location, city: 'Saugatuck' };
        if (!seen.has(ev.id)) {
          seen.add(ev.id);
          events.push(ev);
        }
      }
    }
    if (events.length === 0) {
      const gen = scrapeGenericEvents($, SOURCE, LOC, scrapedAt).filter((e) => new Date(e.date) >= today);
      for (const ev of gen) {
        if (!seen.has(ev.id)) {
          seen.add(ev.id);
          events.push(ev);
        }
      }
    }
    if (events.length === 0) {
      addWednesdaySeries(
        events,
        SOURCE,
        scrapedAt,
        '2026-06-17',
        '2026-08-26',
        'Music in the Park',
        'Free Wednesday concerts at Wicks Park. Visit the event page for the weekly lineup.',
        LOC,
        config.url,
        '7:00 PM'
      );
    }
    console.log(`    Saugatuck Music in the Park: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (e) {
    const events = [];
    addWednesdaySeries(
      events,
      SOURCE,
      scrapedAt,
      '2026-06-17',
      '2026-08-26',
      'Music in the Park',
      `Could not fetch live page (${e.message}). Placeholder Wednesdays; confirm lineup at ${config.url}`,
      LOC,
      config.url,
      '7:00 PM'
    );
    console.log(`    Saugatuck Music in the Park: ${events.length} (fallback)`);
    return createScrapeResult(SOURCE, events);
  }
}

async function scrapeSpartaParkConcerts() {
  const SOURCE = 'sparta-park-concerts';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const year = 2026;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const html = await fetchHtml(config.url);
    const stripped = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#0*39;/g, "'")
      .replace(/\s+/g, ' ');

    const re = /(May|June|July|August|Aug)\s+(\d{1,2})\s+(.+?)(?=(?:May|June|July|August|Aug)\s+\d{1,2}|Sparta's Social|Sparta Eateries|$)/gi;
    const events = [];
    const seen = new Set();
    let m;
    while ((m = re.exec(stripped)) !== null) {
      const monRaw = m[1].toLowerCase() === 'aug' ? 'august' : m[1].toLowerCase();
      const month = MONTHS[monRaw];
      const dayNum = parseInt(m[2], 10);
      let rest = cleanText(decodeHtmlEntities(m[3]));
      if (!month || !rest || rest.length < 8) continue;
      if (/through\s+august/i.test(rest)) continue;

      const date = `${year}-${month}-${String(dayNum).padStart(2, '0')}`;
      if (new Date(date) < today) continue;

      const title = rest
        .replace(/\s+in\s+Rogers Park.*$/i, '')
        .replace(/\s+in\s+Town Square.*$/i, '')
        .replace(/\s*&\s*Kid.*$/i, '')
        .replace(/\s*&\s*Specialty.*$/i, '')
        .replace(/\s*&\s*Specialt.*$/i, '')
        .trim();

      if (!title || /NO CONCERT/i.test(title)) continue;

      const loc = /Rogers Park/i.test(rest)
        ? { name: 'Rogers Park', address: '152 N State St', city: 'Sparta', state: 'MI', zip: '49345' }
        : { name: 'Sparta Town Square', address: '177 E. Division St', city: 'Sparta', state: 'MI', zip: '49345' };

      const id = generateEventId(SOURCE, title, date);
      if (seen.has(id)) continue;
      seen.add(id);

      events.push({
        id,
        title,
        description: `Sparta summer concert series. ${cleanText(rest)}`,
        date,
        time: '6:30 PM',
        startDateTime: toISODateTime(date, '6:30 PM'),
        location: loc,
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Sparta park concerts: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeKentwoodSummerConcerts() {
  const SOURCE = 'kentwood-summer-concerts';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const LOC = {
    name: 'Kentwood City Hall lawn',
    address: '4900 Breton Ave SE',
    city: 'Kentwood',
    state: 'MI',
    zip: '49508',
  };
  const year = 2026;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const html = await fetchHtml(config.url);
    const text = cleanText(
      loadHtml(html)('body').text().replace(/\u00a0/g, ' ')
    );

    const monthMap = { JUNE: '06', JULY: '07', AUGUST: '08' };
    const events = [];
    const seen = new Set();

    const re = /(JUNE|JULY|AUGUST)\s+(\d{1,2})\s*.*?Concert:\s*(.+?)\s*[–\-]\s*6:30-8/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const month = monthMap[m[1].toUpperCase()];
      const day = m[2].padStart(2, '0');
      if (!month) continue;
      const date = `${year}-${month}-${day}`;
      if (new Date(date) < today) continue;

      const title = cleanText(m[3])
        .replace(/\s+Food Trucks.*$/i, '')
        .replace(/\s*-\s*Hippest.*$/i, '')
        .replace(/\s*-\s*Reggae.*$/i, '')
        .replace(/\s*-\s*Folk.*$/i, '')
        .replace(/\s*-\s*80s.*$/i, '')
        .replace(/\s*-\s*Classic big band.*$/i, '')
        .replace(/\s*-\s*Funk.*$/i, '')
        .replace(/\s*-\s*Energetic Latin.*$/i, '')
        .replace(/\s*-\s*Party hits.*$/i, '')
        .replace(/\s*-\s*Traditional and contemporary blues.*$/i, '')
        .replace(/\s*-\s*Variety of high energy.*$/i, '')
        .trim();

      if (!title) continue;

      const id = generateEventId(SOURCE, title, date);
      if (seen.has(id)) continue;
      seen.add(id);

      events.push({
        id,
        title,
        description: 'Kentwood Summer Concert Series — free Thursday concerts on the lawn behind City Hall. BYO beer/wine; dogs on leash welcome.',
        date,
        time: '6:30 PM',
        startDateTime: toISODateTime(date, '6:30 PM'),
        location: { ...LOC },
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    }

    console.log(`    Kentwood summer concerts: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeEastGRConcertsPark() {
  const SOURCE = 'eastgr-concerts-park';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const LOC = {
    name: 'John Collins Park',
    address: '650 Lakeside Dr SE',
    city: 'East Grand Rapids',
    state: 'MI',
    zip: '49506',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const body = cleanText($('body').text());
    if (/coming soon/i.test(body)) {
      const id = generateEventId(SOURCE, 'Concerts in the Park 2026 schedule TBD', '2026-06-01');
      events.push({
        id,
        title: 'Concerts in the Park — 2026 schedule TBD',
        description: 'The city site lists the 2026 lineup as coming soon. Free Monday concerts at 7 p.m. in John Collins Park when posted.',
        date: '2026-06-01',
        time: '7:00 PM',
        startDateTime: toISODateTime('2026-06-01', '7:00 PM'),
        location: LOC,
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    } else {
      const gen = scrapeGenericEvents($, SOURCE, LOC, scrapedAt);
      events.push(...gen);
    }

    console.log(`    East GR Concerts in the Park: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeLowellSizzlin() {
  const SOURCE = 'lowell-sizzlin';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const LOC = {
    name: 'Lowell Showboat / Riverwalk (near KDL Englehardt Library)',
    address: '200 N Monroe St',
    city: 'Lowell',
    state: 'MI',
    zip: '49331',
  };
  const year = 2026;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();

    $('h4[class*="iconlist_title"]').each((_, el) => {
      const raw = cleanText($(el).text());
      if (!raw) return;

      let date = null;
      let time = '7:00 PM';
      let title = '';

      const rf = raw.match(/Riverwalk Festival:.*?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{1,2})\s*(AM|PM)\s*-\s*(.+)$/i);
      if (rf) {
        const mo = MONTHS[rf[1].toLowerCase()];
        if (!mo) return;
        date = `${year}-${mo}-${rf[2].padStart(2, '0')}`;
        time = parseTime(`${rf[3]}:00 ${rf[4].toUpperCase()}`);
        title = cleanText(rf[5]);
      } else {
        const rfFri = raw.match(/Riverwalk Festival:\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*-\s*(.+)$/i);
        if (rfFri) {
          const mo = MONTHS[rfFri[1].toLowerCase()];
          if (!mo) return;
          date = `${year}-${mo}-${rfFri[2].padStart(2, '0')}`;
          title = cleanText(rfFri[3]);
          time = '7:00 PM';
        } else {
        const rf2 = raw.match(/Riverwalk Festival:.*?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*-\s*(.+)$/i);
        if (rf2) {
          const mo = MONTHS[rf2[1].toLowerCase()];
          if (!mo) return;
          date = `${year}-${mo}-${rf2[2].padStart(2, '0')}`;
          title = cleanText(rf2[3]);
          if (/Ultrasonik/i.test(raw)) time = '7:00 PM';
          else if (/5\s*PM/i.test(raw)) time = '5:00 PM';
        } else {
          const std = raw.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s*-\s*(.+)$/i);
          if (!std) return;
          const mo = MONTHS[std[1].toLowerCase()];
          if (!mo) return;
          date = `${year}-${mo}-${std[2].padStart(2, '0')}`;
          title = cleanText(std[3]);
        }
        }
      }

      if (!date || !title) return;
      if (/NO CONCERT/i.test(title)) return;
      if (new Date(date) < today) return;

      const id = generateEventId(SOURCE, title, date);
      if (seen.has(id)) return;
      seen.add(id);

      events.push({
        id,
        title,
        description: 'Sizzlin’ Summer Concerts — free Thursday series on the Lowell riverwalk.',
        date,
        time,
        startDateTime: toISODateTime(date, time),
        location: { ...LOC },
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    });

    console.log(`    Lowell Sizzlin: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeGrandHavenFreeFridays() {
  const SOURCE = 'grandhaven-free-fridays';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const LOC = {
    name: 'Lynne Sherwood Waterfront Stadium',
    address: '1 N Harbor Dr',
    city: 'Grand Haven',
    state: 'MI',
    zip: '49417',
  };
  const year = 2026;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();

    const pairs = [
      [7, 3], [7, 10], [7, 17], [8, 7], [8, 14], [8, 21],
    ];
    for (const [mo, da] of pairs) {
      const date = `${year}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
      if (new Date(date) < today) continue;
      const id = generateEventId(SOURCE, 'Grand Haven Free Fridays', date);
      if (seen.has(id)) continue;
      seen.add(id);
      events.push({
        id,
        title: 'Grand Haven Free Fridays',
        description: 'Free Friday concert at Lynne Sherwood Waterfront Stadium. Check grandhavenfreefridays.com for performer announcements.',
        date,
        time: '6:00 PM',
        startDateTime: toISODateTime(date, '6:00 PM'),
        location: { ...LOC },
        url: config.url,
        source: SOURCE,
        category: 'outdoor',
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    }

    for (const item of extractJsonLdEvents($)) {
      const ev = parseJsonLdEvent(item, SOURCE, scrapedAt);
      if (ev && String(ev.date).startsWith(String(year)) && new Date(ev.date) >= today) {
        ev.location = { ...LOC, ...ev.location };
        if (!seen.has(ev.id)) {
          seen.add(ev.id);
          events.push(ev);
        }
      }
    }

    console.log(`    Grand Haven Free Fridays: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeMuskegonCityTagged() {
  const SOURCE = 'muskegon-city-tagged';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const year = 2026;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultLoc = {
    name: 'Muskegon (see event)',
    address: '',
    city: 'Muskegon',
    state: 'MI',
    zip: '49440',
  };

  try {
    const events = [];
    const seen = new Set();

    for (let month = 5; month <= 9; month++) {
      const mm = String(month).padStart(2, '0');
      let listUrl = `https://muskegon-mi.gov/events/list/?tribe-bar-date=${year}-${mm}-01&tribe_tags%5B0%5D=702`;

      while (listUrl) {
        const html = await fetchHtml(listUrl);
        const $ = loadHtml(html);

        $('li.tribe-events-calendar-list__event-row').each((_, el) => {
          const $el = $(el);
          const title = cleanText(
            $el.find('.tribe-events-calendar-list__event-title-link').first().text()
          );
          if (!title) return;

          const href = $el.find('a.tribe-events-calendar-list__event-title-link').first().attr('href') || '';
          const slug = (href.match(/\/(\d{4}-\d{2}-\d{2})\/?$/) || [])[1] || date;
          const dtSpan = cleanText($el.find('.tribe-event-date-start').first().text());
          const parsed = parseTribeListDateTimeSpan(dtSpan, year);
          if (!parsed) return;
          const { date, time } = parsed;
          if (new Date(date) < today) return;

          const id = `${SOURCE}-${slug}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          if (seen.has(id)) return;
          seen.add(id);

          events.push({
            id,
            title,
            description: cleanText($el.find('.tribe-events-calendar-list__event-description').first().text()).slice(0, 400),
            date,
            time,
            startDateTime: toISODateTime(date, time),
            location: { ...defaultLoc },
            url: href || listUrl,
            source: SOURCE,
            category: categorizeMusicEvent(title, ''),
            isRecurring: false,
            isFree: detectFreeEvent(title, $el.text()),
            scrapedAt,
          });
        });

        const nextHref = $('a[rel="next"]').attr('href') || $('a.tribe-events-nav-next').attr('href');
        listUrl = nextHref
          ? (nextHref.startsWith('http') ? nextHref : `https://muskegon-mi.gov${nextHref.startsWith('/') ? '' : '/'}${nextHref}`)
          : null;
        if (listUrl) await delay(500);
      }
      await delay(800);
    }

    console.log(`    Muskegon city tagged: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeVisitMuskegonConcerts() {
  const SOURCE = 'visit-muskegon-concerts';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const LOC = {
    name: 'Muskegon County',
    address: '610 W Western Ave',
    city: 'Muskegon',
    state: 'MI',
    zip: '49440',
  };

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = scrapeGenericEvents($, SOURCE, LOC, scrapedAt).filter((e) => {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d >= new Date(new Date().toISOString().split('T')[0]);
    });
    console.log(`    Visit Muskegon concerts page: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

// =============================================================================
// Ada / Caledonia / Wyoming / Rockford community concert scrapers
// =============================================================================

async function scrapeAdaParksSummerConcerts() {
  const SOURCE = 'ada-parks-summer-concerts';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const LOC = {
    name: 'Legacy Park',
    address: '7430 River St SE',
    city: 'Ada',
    state: 'MI',
    zip: '49301',
  };

  try {
    const events = [];
    const seen = new Set();

    const communityHtml = await fetchHtml('https://www.adamichigan.org/community/events.php');
    const $community = loadHtml(communityHtml);

    for (const block of extractAdaCommunityMusicBlocks($community)) {
      const { title, blockText, eventUrl } = block;
      const baseDesc =
        cleanText(blockText).slice(0, 500) ||
        'Summer concert at Legacy Park (Ada Township Parks & Recreation).';

      if (/music on the lawn/i.test(title)) {
        for (const date of parseAdaMusicOnTheLawnDates(blockText, year)) {
          if (new Date(`${date}T12:00:00`) < today) continue;
          const ev = buildMusicEvent({
            sourceId: SOURCE,
            title: 'Music on the Lawn',
            date,
            time: '7:00 PM',
            description: baseDesc,
            location: LOC,
            url: eventUrl || config.url,
            scrapedAt,
            isRecurring: true,
          });
          if (!seen.has(ev.id)) {
            seen.add(ev.id);
            events.push(ev);
          }
        }
        continue;
      }

      if (/beers at the bridge/i.test(title)) {
        for (const date of extractTownshipDatesFromText(blockText, year)) {
          if (new Date(`${date}T12:00:00`) < today) continue;
          const ev = buildMusicEvent({
            sourceId: SOURCE,
            title: 'Beers at the Bridge',
            date,
            time: '6:00 PM',
            description: baseDesc,
            location: LOC,
            url: eventUrl || config.url,
            scrapedAt,
          });
          if (!seen.has(ev.id)) {
            seen.add(ev.id);
            events.push(ev);
          }
        }
        continue;
      }

      if (/4th of july/i.test(title)) {
        const date = `${year}-07-04`;
        if (new Date(`${date}T12:00:00`) >= today) {
          const ev = buildMusicEvent({
            sourceId: SOURCE,
            title: '4th of July Celebration Concert',
            date,
            time: '2:00 PM',
            description: baseDesc,
            location: LOC,
            url: eventUrl || config.url,
            scrapedAt,
          });
          if (!seen.has(ev.id)) {
            seen.add(ev.id);
            events.push(ev);
          }
        }
      }
    }

    console.log(`    Ada Parks summer concerts: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeWyomingConcertsPark() {
  const SOURCE = 'wyoming-concerts-park';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const LOC = {
    name: 'Lamar Park',
    address: '2561 Porter St SW',
    city: 'Wyoming',
    state: 'MI',
    zip: '49519',
  };

  try {
    const html = await fetchHtml(config.url);
    const text = cleanText(loadHtml(html)('body').text());
    const events = [];
    const seen = new Set();

    const intro =
      'Concerts in the Park at Lamar Park, 6 p.m. Food trucks on site. Bring a lawn chair.';

    const re =
      /\b(June|July)\s+(\d{1,2})\s*-\s*([^:]+?)(?::\s*([^]+?))?(?=\s*(?:June|July)\s+\d{1,2}\s*-|$)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const month = MONTHS[m[1].toLowerCase()];
      if (!month) continue;
      const date = `${year}-${month}-${m[2].padStart(2, '0')}`;
      if (new Date(`${date}T12:00:00`) < today) continue;

      const artist = cleanText(m[3]);
      const style = m[4] ? cleanText(m[4]) : '';
      const title = artist;
      const description = style
        ? `${intro} ${style}`
        : `${intro} Featuring ${artist}.`;

      const ev = buildMusicEvent({
        sourceId: SOURCE,
        title,
        date,
        time: '6:00 PM',
        description,
        location: LOC,
        url: config.url,
        scrapedAt,
      });
      if (!seen.has(ev.id)) {
        seen.add(ev.id);
        events.push(ev);
      }
    }

    console.log(`    Wyoming Concerts in the Park: ${events.length} events`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeCaledoniaConcertSeries() {
  const SOURCE = 'caledonia-concert-series';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const LOC = {
    name: 'Caledonia Community Green Park',
    address: '9309 Dobber Wenger Memorial Dr',
    city: 'Caledonia',
    state: 'MI',
  };
  const baseDesc =
    'Caledonia Community Green Park summer concert series (Tuesdays, 6 p.m. opening act / 7 p.m. headliners).';

  try {
    let lineup = null;
    let lineupSource = '';

    try {
      const embedHtml = await fetchHtml('https://www.instagram.com/p/DX8B2FERAbM/embed/captioned/');
      const captionMatch = embedHtml.match(/"caption":"((?:\\.|[^"\\])*)"/);
      if (captionMatch) {
        const caption = captionMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\u([\dA-Fa-f]{4})/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
          .replace(/\\"/g, '"');
        const parsed = parseMonthDayArtistLineup(caption, year);
        if (parsed.length) {
          lineup = parsed;
          lineupSource = 'Instagram post caption';
        }
      }
    } catch (e) {
      console.log(`    Caledonia Instagram: ${e.message}`);
    }

    if (!lineup || lineup.length === 0) {
      const section = await fetchLocalSpins2026Section('CALEDONIA CONCERT SERIES');
      if (section) {
        lineup = parseMonthDayArtistLineup(section, year);
        lineupSource = 'Local Spins 2026 community concerts guide (fallback)';
      }
    }

    if (!lineup || lineup.length === 0) {
      return createScrapeResult(SOURCE, [], 'No Caledonia concert lineup found');
    }

    const events = [];
    for (const row of lineup) {
      if (new Date(`${row.date}T12:00:00`) < today) continue;
      events.push(
        buildMusicEvent({
          sourceId: SOURCE,
          title: row.title,
          date: row.date,
          time: '7:00 PM',
          description: `${baseDesc} (${lineupSource}).`,
          location: LOC,
          url: config.url,
          scrapedAt,
        })
      );
    }

    console.log(`    Caledonia concert series: ${events.length} events (${lineupSource})`);
    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeRockfordRogueBlues() {
  const SOURCE = 'rockford-rogue-blues';
  const config = SOURCE_CONFIG[SOURCE];
  const newsUrl = config.url;
  const scrapedAt = new Date().toISOString();
  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const gardenLoc = {
    name: 'Garden Club Park — Rogue River stage',
    address: 'White Pine Trail, downtown Rockford',
    city: 'Rockford',
    state: 'MI',
  };
  const rotaryLoc = {
    name: 'Rotary Pavilion',
    address: 'Squires Street area (downtown Rockford)',
    city: 'Rockford',
    state: 'MI',
  };

  const dateShift = {
    '2026-06-09': '2026-06-10',
    '2026-06-16': '2026-06-17',
  };
  const rotaryDates = new Set(['2026-06-10', '2026-06-17']);

  try {
    const section = await fetchLocalSpins2026Section('ROCKFORD: ROGUE RIVER BLUES SERIES');
    if (!section) {
      return createScrapeResult(SOURCE, [], 'Rockford blues lineup not found in Local Spins 2026 guide');
    }

    const lineup = parseMonthDayArtistLineup(section, year);
    const events = [];
    const seen = new Set();

    let relocationNote = '';
    try {
      const newsHtml = await fetchHtml(newsUrl);
      const newsText = cleanText(loadHtml(newsHtml)('body').text());
      if (/rotary pavilion/i.test(newsText)) {
        relocationNote =
          ' June 10 & 17 performances at Rotary Pavilion while Garden Club Park construction continues (per City of Rockford).';
      }
    } catch {
      // optional news fetch
    }

    for (const row of lineup) {
      let date = row.date;
      if (dateShift[date]) date = dateShift[date];
      if (new Date(`${date}T12:00:00`) < today) continue;

      const location = rotaryDates.has(date) ? { ...rotaryLoc } : { ...gardenLoc };
      const description = `Rogue River Blues Series — free Tuesday blues in downtown Rockford, 7 p.m.${relocationNote}`;

      const ev = buildMusicEvent({
        sourceId: SOURCE,
        title: row.title,
        date,
        time: '7:00 PM',
        description,
        location,
        url: rotaryDates.has(date) ? newsUrl : 'https://www.rockford.mi.us/concerts',
        scrapedAt,
      });
      if (!seen.has(ev.id)) {
        seen.add(ev.id);
        events.push(ev);
      }
    }

    console.log(`    Rockford Rogue River Blues: ${events.length} events`);
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
    { name: 'Saugatuck Music in the Park', fn: scrapeSaugatuckMusicPark },
    { name: 'Sparta Summer Concerts', fn: scrapeSpartaParkConcerts },
    { name: 'Kentwood Summer Concerts', fn: scrapeKentwoodSummerConcerts },
    { name: 'East GR Concerts in the Park', fn: scrapeEastGRConcertsPark },
    { name: 'Lowell Sizzlin Summer Concerts', fn: scrapeLowellSizzlin },
    { name: 'Grand Haven Free Fridays', fn: scrapeGrandHavenFreeFridays },
    { name: 'Muskegon City (tagged)', fn: scrapeMuskegonCityTagged },
    { name: 'Visit Muskegon concerts', fn: scrapeVisitMuskegonConcerts },
    { name: 'The Score GR', fn: scrapeScoreGR },
    { name: 'Ada Parks Summer Concerts', fn: scrapeAdaParksSummerConcerts },
    { name: 'Caledonia Concert Series', fn: scrapeCaledoniaConcertSeries },
    { name: 'Wyoming Concerts in the Park', fn: scrapeWyomingConcertsPark },
    { name: 'Rockford Rogue River Blues', fn: scrapeRockfordRogueBlues },
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

    const { events, sources } = await runFullScrape();

    let preservedLocalSpins = [];
    try {
      const existingRaw = await fs.readFile(DATA_FILE, 'utf-8');
      const existing = JSON.parse(existingRaw);
      preservedLocalSpins = (existing.events || []).filter((e) => e.source === 'local-spins');
    } catch {
      // no prior file
    }

    const seenIds = new Set(events.map((e) => e.id));
    for (const e of preservedLocalSpins) {
      if (!seenIds.has(e.id)) {
        seenIds.add(e.id);
        events.push(e);
      }
    }

    if (preservedLocalSpins.length > 0) {
      sources['local-spins'] = {
        ...SOURCE_CONFIG['local-spins'],
        eventCount: preservedLocalSpins.length,
        lastScraped: new Date().toISOString(),
        note: 'Imported from docs/local-spins guide via merge-local-spins-guide.mjs; preserved across scrapes.',
      };
    }

    events.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

    console.log('');
    console.log(`Total: ${events.length} unique events from ${Object.keys(sources).length} sources (${preservedLocalSpins.length} Local Spins manual rows preserved)`);
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
