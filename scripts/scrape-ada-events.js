#!/usr/bin/env node
/**
 * Ada Events Calendar - Scrape Script
 *
 * Scrapes events from Ada-area sources and saves them to src/data/ada-events.json.
 * Run with: node scripts/scrape-ada-events.js
 *
 * Sources:
 *  - Ada Business Association (auto-discovered Meetings & Events submenu)
 *  - Ada Township Community events
 *  - Ada Township Parks & Recreation events
 *  - Ada Farmers Market (seasonal recurring Tuesdays)
 *  - Amy Van Andel Library (KDL BiblioCommons API, branch=ADA)
 *  - Discover Ada
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
  'ada-business-association': {
    id: 'ada-business-association',
    name: 'Ada Business Association',
    url: 'https://adabusinessassociation.com/events/',
    color: '#1976D2',
  },
  'ada-township-community': {
    id: 'ada-township-community',
    name: 'Ada Township Events',
    url: 'https://www.adamichigan.org/community/events.php',
    color: '#2E7D32',
  },
  'ada-township-parks': {
    id: 'ada-township-parks',
    name: 'Ada Parks & Recreation',
    url: 'https://www.adamichigan.org/departments/parks_recreation_land_preservation/community___special_events.php',
    color: '#4CAF50',
  },
  'ada-farmers-market': {
    id: 'ada-farmers-market',
    name: 'Ada Farmers Market',
    url: 'https://www.adamichigan.org/community/community/farmers_market/index.php',
    color: '#FF6B35',
  },
  'amy-van-andel-library': {
    id: 'amy-van-andel-library',
    name: 'Amy Van Andel Library',
    url: 'https://kdl.bibliocommons.com/events/search/index?locations%5B%5D=avl',
    color: '#9C27B0',
  },
  'discover-ada': {
    id: 'discover-ada',
    name: 'Discover Ada',
    url: 'https://www.adavillage.com/',
    color: '#E65100',
  },
};

const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'ada-events.json');
const CACHE_FILE = path.join(__dirname, '..', 'src', 'data', 'geocache.json');

// =============================================================================
// Utility Functions
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

  const monthMatch = cleaned.match(/([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthMatch) {
    const month = MONTHS[monthMatch[1].toLowerCase()];
    if (month) {
      const day = monthMatch[2].padStart(2, '0');
      return `${monthMatch[3]}-${month}-${day}`;
    }
  }

  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    return `${slashMatch[3]}-${month}-${day}`;
  }

  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // ignore
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
  if (!timeMatch) return `${date}T00:00:00`;
  let hour = parseInt(timeMatch[1]);
  const minute = timeMatch[2];
  const period = timeMatch[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${date}T${hour.toString().padStart(2, '0')}:${minute}:00`;
}

async function fetchHtml(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(t);
  }
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
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  try {
    const $ = loadHtml('<div></div>');
    $('div').html(String(str));
    return $('div').text();
  } catch {
    return cleanText(stripHtml(String(str)));
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// =============================================================================
// Recurring / Free Event Detection
// =============================================================================

const KNOWN_RECURRING_EVENTS = [
  'happy hour', 'lunch & learn', 'lunch and learn', 'monthly member',
  'farmers market', 'music on the lawn', 'coffee connect', 'weekly',
  'open house', 'story time', 'storytime',
];

const RECURRING_PATTERNS = [
  /\bevery\s+(week|month|day|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /\bweekly\b/i,
  /\bmonthly\b/i,
  /\bdaily\b/i,
  /\brecurring\b/i,
  /\bongoing\b/i,
  /\b(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /\bthroughout\s+the\s+year\b/i,
];

function detectRecurringEvent(title, description = '', extra = '') {
  const combined = `${title} ${description} ${extra}`.toLowerCase();
  for (const known of KNOWN_RECURRING_EVENTS) {
    if (combined.includes(known)) return true;
  }
  for (const pattern of RECURRING_PATTERNS) {
    if (pattern.test(combined)) return true;
  }
  return false;
}

function detectFreeEvent(title, description = '', extra = '') {
  const text = `${title} ${description} ${extra}`.toLowerCase();
  if (text.includes('members only') || text.includes('member only')) return false;
  if (text.includes('private event')) return false;
  if (text.includes('get tickets') || text.includes('buy tickets') || text.includes('purchase tickets')) return false;
  if (/\$\d+/.test(text) && !text.includes('free')) return false;
  if (text.includes('registration fee') || text.includes('admission fee')) return false;
  if (text.includes('ticket price') || text.includes('event fee')) return false;
  if (text.includes('paid event')) return false;

  if (text.includes('free event') || text.includes('free admission')) return true;
  if (text.includes('no admission fee')) return true;
  if (text.includes('no cost') || text.includes('no charge') || text.includes('no fee')) return true;
  if (/\bfree\b/.test(text) && !text.includes('free parking')) return true;

  if (text.includes('public event') && !text.includes('ticket')) return true;
  return true;
}

function categorizeEventByContent(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('parade') || text.includes('fireworks') || text.includes('celebration') ||
      text.includes('festival') || text.includes('extravaganza') || text.includes('prowl') ||
      text.includes('trolley') || text.includes('tinsel')) return 'conference';
  if (text.includes('concert') || text.includes('music on the lawn') || text.includes('beers at the bridge') ||
      text.includes('amphitheater')) return 'conference';
  if (text.includes('market') || text.includes('farmers')) return 'other';
  if (text.includes('happy hour') || text.includes('mixer') || text.includes('network') ||
      text.includes('ribbon cutting')) return 'networking';
  if (text.includes('workshop') || text.includes('lunch & learn') || text.includes('lunch and learn') ||
      text.includes('story time') || text.includes('storytime') || text.includes('class')) return 'workshop';
  if (text.includes('meeting') || text.includes('orientation') || text.includes('member meet')) return 'meetup';
  if (text.includes('park') || text.includes('baseball') || text.includes('bark')) return 'other';
  return 'other';
}

// =============================================================================
// ABA Menu Auto-Discovery
// =============================================================================

/**
 * Discover all sub-pages under the "Meetings & Events" menu on adabusinessassociation.com.
 * Robust against the menu item id changing over time: we locate the parent <li> by its
 * "Meetings & Events" top-level anchor text, then collect every link in its `ul.sub-menu`.
 *
 * @returns {Promise<string[]>} deduped list of absolute URLs
 */
async function discoverAbaEventPages() {
  const FALLBACK = [
    'https://adabusinessassociation.com/events/',
    'https://adabusinessassociation.com/happy_hour/',
    'https://adabusinessassociation.com/monthly-member-meetings/',
  ];

  try {
    const html = await fetchHtml('https://adabusinessassociation.com/');
    const $ = loadHtml(html);
    const seen = new Set();
    const links = [];

    const looksLikeEventsTopLink = (text) => {
      const t = (text || '').toLowerCase();
      return /meetings?\s*(?:&|and)\s*events?/.test(t) || t.trim() === 'events';
    };

    $('li.menu-item-has-children').each((_, li) => {
      const $li = $(li);
      const topText = $li.find('a').filter((_, a) => !$(a).closest('ul.sub-menu').length).first().text();
      if (!looksLikeEventsTopLink(topText)) return;

      $li.find('ul.sub-menu a[href]').each((_, a) => {
        const href = $(a).attr('href');
        if (!href) return;
        if (seen.has(href)) return;
        seen.add(href);
        links.push(href);
      });
    });

    if (links.length === 0) {
      console.log('    ABA menu discovery: no submenu links found, falling back to known-pages list');
      return FALLBACK;
    }

    console.log(`    ABA menu discovery: found ${links.length} submenu links`);
    return links;
  } catch (e) {
    console.log(`    ABA menu discovery failed (${e.message}); falling back to known pages`);
    return FALLBACK;
  }
}

// =============================================================================
// ABA: WordPress page scrapers (happy_hour, monthly-member-meetings, etc.)
// =============================================================================

/**
 * Parse events out of an ABA WordPress "series" page (e.g. /happy_hour/ or
 * /monthly-member-meetings/). These pages use a three-h4 pattern per event:
 *   H4 #1: Title (e.g. "May Happy Hour" or "MAY 21ST LUNCH")
 *   H4 #2: Date (e.g. "Wednesday, May 13, 2026")  -- sometimes missing
 *   H4 #3: Venue (e.g. "BGR Event Center - 284 Dodge NE, Comstock Park")
 *
 * Not every page follows the pattern strictly, so we use heuristics:
 *   - Date line is detected by month + day + year pattern
 *   - Venue line is the next h4 that's not a date
 */
function parseAbaWordPressPage($, pageUrl, defaultTime) {
  const events = [];
  const scrapedAt = new Date().toISOString();
  const SOURCE = 'ada-business-association';

  const $h4s = $('h4').toArray();
  const fullDateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i;
  const monthlyTitleRegex = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(?:Happy\s+Hour|Lunch|Meeting|Orientation|Member\s+Lunch)/i;
  const ordinalTitleRegex = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(Lunch|Meeting|Happy\s+Hour|Orientation)/i;

  const now = new Date();
  const currentYear = now.getFullYear();

  // Track which h4 indices we've "consumed" so they don't double as titles later
  const consumed = new Set();

  for (let i = 0; i < $h4s.length; i++) {
    if (consumed.has(i)) continue;
    const $title = $($h4s[i]);
    const titleText = cleanText($title.text());
    if (!titleText) continue;

    const monthlyMatch = titleText.match(monthlyTitleRegex);
    const ordinalMatch = titleText.match(ordinalTitleRegex);
    if (!monthlyMatch && !ordinalMatch) continue;

    let date = null;
    let dateTextConsumedAt = -1;
    let venueText = '';

    // Case A: explicit date heading follows (e.g. "Wednesday, May 13, 2026")
    if (i + 1 < $h4s.length) {
      const nextText = cleanText($($h4s[i + 1]).text());
      const m = nextText.match(fullDateRegex);
      if (m) {
        const mm = MONTHS[m[1].toLowerCase()];
        if (mm) {
          date = `${m[3]}-${mm}-${m[2].padStart(2, '0')}`;
          dateTextConsumedAt = i + 1;
        }
      }
    }

    // Case B: date is embedded in the title itself (e.g. "MAY 21ST LUNCH")
    if (!date && ordinalMatch) {
      const month = MONTHS[ordinalMatch[1].toLowerCase()];
      const day = parseInt(ordinalMatch[2], 10);
      if (month && day >= 1 && day <= 31) {
        // Infer year: if the month/day is still in the future this year, use this year;
        // otherwise assume next year.
        const thisYearDate = new Date(`${currentYear}-${month}-${String(day).padStart(2, '0')}T12:00:00`);
        const year = thisYearDate >= now ? currentYear : currentYear + 1;
        date = `${year}-${month}-${String(day).padStart(2, '0')}`;
      }
    }

    // Case C: title is just a month name (e.g. "May Happy Hour") and no explicit
    // date heading — skip (can't infer the day).
    if (!date) continue;

    // Venue heading is the one immediately after the date heading (or after the title
    // if the date was embedded).
    const venueIdx = dateTextConsumedAt >= 0 ? dateTextConsumedAt + 1 : i + 1;
    if (venueIdx < $h4s.length) {
      const vt = cleanText($($h4s[venueIdx]).text());
      // Ensure this isn't another event title
      if (vt && !monthlyTitleRegex.test(vt) && !ordinalTitleRegex.test(vt)) {
        venueText = vt;
        consumed.add(venueIdx);
      }
    }
    if (dateTextConsumedAt >= 0) consumed.add(dateTextConsumedAt);

    let locationName = 'Ada Business Association';
    let address = '';
    let city = 'Ada';
    if (venueText) {
      const dashIdx = venueText.indexOf(' - ');
      locationName = dashIdx >= 0 ? venueText.substring(0, dashIdx).trim() : venueText;
      address = dashIdx >= 0 ? venueText.substring(dashIdx + 3).trim() : '';
      if (/Comstock Park/i.test(venueText)) city = 'Comstock Park';
      else if (/Grand Rapids/i.test(venueText)) city = 'Grand Rapids';
      else if (/Cascade/i.test(venueText)) city = 'Cascade';
      else if (address && !/Ada|Headley/i.test(venueText) && !/ABA Office/i.test(locationName)) city = 'Grand Rapids';
    }

    const $block = $title.nextUntil('h4');
    let description = '';
    $block.find('p').each((_, p) => {
      const text = cleanText($(p).text());
      if (text) description += (description ? ' ' : '') + text;
    });
    if (description.length > 500) description = description.substring(0, 497) + '...';

    const effectiveTitle = `${titleText} (ABA)`;
    events.push({
      id: generateEventId(SOURCE, effectiveTitle, date),
      title: effectiveTitle,
      description: description || `ABA event at ${locationName}.`,
      date,
      time: defaultTime,
      startDateTime: toISODateTime(date, defaultTime),
      location: { name: locationName, address, city, state: 'MI' },
      url: pageUrl,
      source: SOURCE,
      category: categorizeEventByContent(effectiveTitle, description),
      isRecurring: true,
      isFree: true,
      scrapedAt,
    });
  }

  return events;
}

// =============================================================================
// ABA: ChamberMaster event detail page scraper
//   (business.adabusinessassociation.com/events/details/<slug>)
// =============================================================================

function parseChamberMasterEventPage($, pageUrl) {
  const SOURCE = 'ada-business-association';
  const scrapedAt = new Date().toISOString();

  // Title: first h1 of the main content
  const title = cleanText($('h1').not(':contains("EVENTS")').first().text()) ||
                cleanText($('h1').last().text()) || '';
  if (!title || title.length < 3) return null;

  // Body text for date/location/admission parsing
  const bodyText = cleanText($('main, #primary, .entry-content, body').first().text());

  // Look for "Date and Time" block which has a structure like:
  //   Saturday Mar 7, 2026
  //   9:00 AM - 1:00 PM EST
  // The labelled <h5> headings ("Date and Time", "Location", "Fees/Admission")
  // mark the start of each sidebar block.
  let dateBlock = '';
  let locationBlock = '';
  let feesBlock = '';
  $('h5').each((_, h5) => {
    const label = cleanText($(h5).text()).toLowerCase();
    const $container = $(h5).parent();
    const next = cleanText($container.text()).replace(cleanText($(h5).text()), '').trim();
    if (label.includes('date and time') && !dateBlock) dateBlock = next;
    else if (label.includes('location') && !locationBlock) locationBlock = next;
    else if ((label.includes('fees') || label.includes('admission')) && !feesBlock) feesBlock = next;
  });

  if (!dateBlock) {
    // Fallback: hunt for a date pattern in the whole body
    dateBlock = bodyText;
  }

  const dateMatch = dateBlock.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (!dateMatch) return null;
  const month = MONTHS[dateMatch[1].toLowerCase()];
  if (!month) return null;
  const day = dateMatch[2].padStart(2, '0');
  const date = `${dateMatch[3]}-${month}-${day}`;

  // Optional end date — e.g. "Tuesday Dec 1, 2026 Thursday Dec 31, 2026"
  const endDateMatch = dateBlock.slice(dateMatch.index + dateMatch[0].length)
    .match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  let endDate = null;
  if (endDateMatch) {
    const em = MONTHS[endDateMatch[1].toLowerCase()];
    if (em) endDate = `${endDateMatch[3]}-${em}-${endDateMatch[2].padStart(2, '0')}`;
  }

  // Time "9:00 AM - 1:00 PM"
  const timeMatch = dateBlock.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  const singleTimeMatch = dateBlock.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  let time = 'TBD';
  let endTime = null;
  if (timeMatch) {
    time = parseTime(timeMatch[1]);
    endTime = parseTime(timeMatch[2]);
  } else if (singleTimeMatch) {
    time = parseTime(singleTimeMatch[1]);
  }

  // Location: "Ada Christian School - 6206 Ada Dr, Ada, MI"
  let locationName = 'Ada, MI';
  let address = '';
  let city = 'Ada';
  if (locationBlock) {
    const dashIdx = locationBlock.indexOf(' - ');
    if (dashIdx >= 0) {
      locationName = locationBlock.substring(0, dashIdx).trim();
      address = locationBlock.substring(dashIdx + 3).trim();
    } else {
      locationName = locationBlock.trim();
    }
    const cityMatch = address.match(/,\s*([A-Za-z][A-Za-z\s]+?),\s*MI/);
    if (cityMatch) city = cityMatch[1].trim();
  }

  // Description: first large paragraph after the title
  let description = '';
  $('p').each((_, p) => {
    if (description) return;
    const t = cleanText($(p).text());
    if (t.length > 40 && t.length < 700) description = t;
  });

  const feesText = (feesBlock || '').toLowerCase();
  const isFree = /no\s+admission|free/.test(feesText) || detectFreeEvent(title, description, feesText);

  const event = {
    id: generateEventId(SOURCE, title, date),
    title,
    description: description || 'Ada Business Association community event.',
    date,
    time,
    startDateTime: toISODateTime(date, time),
    location: { name: locationName, address, city, state: 'MI' },
    url: pageUrl,
    source: SOURCE,
    category: categorizeEventByContent(title, description),
    isRecurring: detectRecurringEvent(title, description, bodyText),
    isFree,
    scrapedAt,
  };
  if (endTime) event.endDateTime = toISODateTime(date, endTime);
  if (endDate && endDate !== date) event.endDate = endDate;
  return event;
}

// =============================================================================
// ABA Root Scraper (fans out across discovered subpages)
// =============================================================================

async function scrapeAdaBusinessAssociation() {
  const SOURCE = 'ada-business-association';
  const scrapedAt = new Date().toISOString();

  try {
    const menuLinks = await discoverAbaEventPages();

    const wordpressLinks = menuLinks.filter(u => /^https?:\/\/(www\.)?adabusinessassociation\.com\//i.test(u));
    const chamberLinks = menuLinks.filter(u => /business\.adabusinessassociation\.com\/events\/details\//i.test(u));

    const allEvents = [];

    for (const url of wordpressLinks) {
      try {
        const html = await fetchHtml(url);
        const $ = loadHtml(html);

        let defaultTime = '4:30 PM';
        if (/monthly-member-meetings|lunch/i.test(url)) defaultTime = '11:30 AM';
        else if (/orientation/i.test(url)) defaultTime = '8:30 AM';

        const pageEvents = parseAbaWordPressPage($, url, defaultTime);
        if (pageEvents.length) {
          console.log(`      WordPress ${url}: ${pageEvents.length} events`);
          allEvents.push(...pageEvents);
        }
        await delay(500);
      } catch (e) {
        console.log(`      Skipped ${url}: ${e.message}`);
      }
    }

    for (const url of chamberLinks) {
      try {
        const html = await fetchHtml(url);
        const $ = loadHtml(html);
        const ev = parseChamberMasterEventPage($, url);
        if (ev) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const eventDate = new Date(`${ev.date}T12:00:00`);
          const endDate = ev.endDate ? new Date(`${ev.endDate}T12:00:00`) : eventDate;
          if (endDate >= today) {
            console.log(`      ChamberMaster ${url}: "${ev.title}"`);
            allEvents.push(ev);
          } else {
            console.log(`      ChamberMaster ${url}: skipped (past)`);
          }
        }
        await delay(500);
      } catch (e) {
        console.log(`      Skipped ${url}: ${e.message}`);
      }
    }

    // Also attempt to scrape the main ChamberMaster Events Calendar listing for
    // any events that aren't in the submenu (e.g. newly-added community/ribbon-cutting events).
    try {
      const listHtml = await fetchHtml('https://business.adabusinessassociation.com/events');
      const $list = loadHtml(listHtml);
      const seenDetailLinks = new Set(chamberLinks);
      const newDetailLinks = [];
      $list('a[href*="business.adabusinessassociation.com/events/details/"], a[href*="/events/details/"]').each((_, a) => {
        let href = $list(a).attr('href') || '';
        if (!href) return;
        if (!href.startsWith('http')) {
          href = href.startsWith('/')
            ? `https://business.adabusinessassociation.com${href}`
            : href;
        }
        if (!/\/events\/details\//i.test(href)) return;
        if (seenDetailLinks.has(href)) return;
        seenDetailLinks.add(href);
        newDetailLinks.push(href);
      });
      if (newDetailLinks.length) {
        console.log(`      ChamberMaster listing: +${newDetailLinks.length} new detail pages`);
      }
      for (const url of newDetailLinks) {
        try {
          const html = await fetchHtml(url);
          const $ = loadHtml(html);
          const ev = parseChamberMasterEventPage($, url);
          if (ev) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const eventDate = new Date(`${ev.date}T12:00:00`);
            const endDate = ev.endDate ? new Date(`${ev.endDate}T12:00:00`) : eventDate;
            if (endDate >= today) allEvents.push(ev);
          }
          await delay(500);
        } catch (e) {
          console.log(`      Skipped ${url}: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`    ChamberMaster listing unavailable: ${e.message}`);
    }

    // Deduplicate
    const unique = Array.from(new Map(allEvents.map(e => [`${e.title}-${e.date}`, e])).values());
    return createScrapeResult(SOURCE, unique);
  } catch (e) {
    return createScrapeResult(SOURCE, [], e.message);
  }
}

// =============================================================================
// Ada Township: Community Events Page
//   https://www.adamichigan.org/community/events.php
// =============================================================================

/**
 * Try to extract a date from event description text. Returns null if it can't
 * find one. Township event blurbs embed dates loosely, e.g.:
 *   "Date: Friday, May 1, 2026 Time: 12 pm-3 pm"
 *   "on May 25,2026 at 550 River St"
 *   "held on the first Saturday in December"
 */
function extractTownshipDate(text, fallbackYear) {
  // Pattern A: "May 1, 2026" or "May 25,2026" or "May 25 2026"
  // Use (?!\d) instead of \b to match "May 9Time:" correctly (word-to-word has no boundary)
  const explicit = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})(?!\d)/i);
  if (explicit) {
    const m = MONTHS[explicit[1].toLowerCase()];
    if (m) return `${explicit[3]}-${m}-${explicit[2].padStart(2, '0')}`;
  }
  // Pattern B: "Saturday, May 9" (year omitted — use fallbackYear)
  const noYear = text.match(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?!\d)/i);
  if (noYear && fallbackYear) {
    const m = MONTHS[noYear[1].toLowerCase()];
    if (m) return `${fallbackYear}-${m}-${noYear[2].padStart(2, '0')}`;
  }
  // Pattern C: "June 12th" / "August 14th" ordinal with inferred year
  const ordinal = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)\b/i);
  if (ordinal && fallbackYear) {
    const m = MONTHS[ordinal[1].toLowerCase()];
    if (m) return `${fallbackYear}-${m}-${ordinal[2].padStart(2, '0')}`;
  }
  return null;
}

/**
 * Extract ALL dates from a text. Useful when a single block describes multiple
 * occurrences (e.g. Beers at the Bridge: "June 12th and August 14th").
 */
function extractAllTownshipDates(text, fallbackYear) {
  const dates = new Set();
  const pushDate = (y, m, d) => {
    if (!y || !m || !d) return;
    dates.add(`${y}-${m}-${String(d).padStart(2, '0')}`);
  };

  const explicitRe = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s*(\d{4})(?!\d)/gi;
  let em;
  while ((em = explicitRe.exec(text)) !== null) {
    const m = MONTHS[em[1].toLowerCase()];
    if (m) pushDate(em[3], m, em[2]);
  }

  const ordinalRe = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)\b/gi;
  let om;
  while ((om = ordinalRe.exec(text)) !== null) {
    const m = MONTHS[om[1].toLowerCase()];
    if (m) pushDate(fallbackYear, m, om[2]);
  }

  const dowRe = /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?!\d)/gi;
  let dm;
  while ((dm = dowRe.exec(text)) !== null) {
    const m = MONTHS[dm[1].toLowerCase()];
    if (m) pushDate(fallbackYear, m, dm[2]);
  }

  return [...dates].sort();
}

function extractTownshipTime(text) {
  // "12 pm-3 pm", "7 pm", "5:15pm to 8:00pm", "1pm"
  const rangeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (rangeMatch) return { time: parseTime(rangeMatch[1]), end: parseTime(rangeMatch[2]) };
  const single = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  if (single) return { time: parseTime(single[1]), end: null };
  return { time: 'TBD', end: null };
}

async function scrapeAdaTownshipCommunity() {
  const SOURCE = 'ada-township-community';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const currentYear = new Date().getFullYear();

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();

    // Each event is rendered as an h2 heading, followed by description paragraphs
    // and a small contact/address block. We walk the DOM in document order and
    // collect every h2 that's an event title (not a section header like "Events").
    const skipTitles = new Set(['events', 'follow us:', 'related pages']);

    $('h2').each((_, el) => {
      const $h2 = $(el);
      const title = cleanText($h2.text());
      if (!title || title.length < 3) return;
      if (skipTitles.has(title.toLowerCase())) return;
      if (/^home$|^departments$|^community$|^services$|^government$/i.test(title)) return;

      // Collect sibling content between this h2 and the next h2
      const $block = $h2.nextUntil('h2');
      const blockText = cleanText($block.text());
      const combined = `${title} ${blockText}`;

      // Skip if block is empty or pure navigation
      if (!blockText) return;

      // Extract address from a Google Maps link in the block, e.g.
      // "1180 Buttrick Avenue, Ada, MI 49301"
      let address = '';
      let city = 'Ada';
      $block.find('a[href*="maps.google"]').each((__, a) => {
        if (address) return;
        const t = cleanText($(a).text());
        if (!t || t.includes(',') === false) return;
        address = t;
        const cityMatch = t.match(/,\s*([^,]+?),\s*MI/);
        if (cityMatch) city = cityMatch[1].trim();
      });

      // Extract Read More or the first external link as the event URL
      let eventUrl = config.url;
      const $readMore = $block.find('a').filter((__, a) => {
        const txt = cleanText($(a).text()).toLowerCase();
        const href = $(a).attr('href') || '';
        return (txt === 'read more' || txt === 'click here') && href && !href.startsWith('tel:') && !href.startsWith('mailto:');
      }).first();
      if ($readMore.length) {
        let href = $readMore.attr('href');
        if (href && !href.startsWith('http')) {
          href = `https://www.adamichigan.org${href.startsWith('/') ? '' : '/'}${href}`;
        }
        if (href) eventUrl = href;
      }

      // Special case: Music on the Lawn has a "Concert Dates:" list of days without year.
      if (/Music on the Lawn/i.test(title)) {
        const concertDates = blockText.match(/Concert\s+Dates:\s*([^.]+)/i);
        if (concertDates) {
          const rawParts = concertDates[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);
          const baseDesc = cleanText(blockText.replace(/Concert\s+Dates:[^.]+/i, '').slice(0, 400));
          // Re-attach the prior month token when a date-only entry shows up (e.g. "June 3, 17, 24, July 8, 15, 22, 29")
          let lastMonth = '';
          for (const part of rawParts) {
            const monthMatch = part.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/i);
            if (monthMatch) lastMonth = monthMatch[1];
            const dayOnly = part.match(/^(\d{1,2})$/);
            const candidate = dayOnly && lastMonth ? `${lastMonth} ${dayOnly[1]}, ${currentYear}` : `${part}, ${currentYear}`;
            const d = extractTownshipDate(candidate, currentYear);
            if (!d) continue;
            const id = generateEventId(SOURCE, title, d);
            if (seen.has(id)) continue;
            seen.add(id);
            events.push({
              id,
              title,
              description: baseDesc || 'Summer concert series at Legacy Park.',
              date: d,
              time: '7:00 PM',
              startDateTime: toISODateTime(d, '7:00 PM'),
              location: { name: 'Legacy Park', address: '7430 River St SE', city: 'Ada', state: 'MI' },
              url: eventUrl,
              source: SOURCE,
              category: 'conference',
              isRecurring: true,
              isFree: true,
              scrapedAt,
            });
          }
          return;
        }
      }

      // General case: pull every concrete date from the block. Some entries
      // describe two occurrences (e.g. "June 12th and August 14th").
      const allDates = extractAllTownshipDates(blockText, currentYear);

      // Skip if the block has no concrete dates (e.g. "first Saturday in December",
      // "beginning of December", "starting June"). These entries tend to be
      // season-spanning placeholders without a scrape-able date.
      if (allDates.length === 0) return;

      const { time, end } = extractTownshipTime(blockText);
      const description = blockText.length > 500 ? blockText.substring(0, 497) + '...' : blockText;

      for (const date of allDates) {
        const id = generateEventId(SOURCE, title, date);
        if (seen.has(id)) continue;
        seen.add(id);

        const ev = {
          id,
          title,
          description,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: {
            name: address || 'Ada Township',
            address,
            city,
            state: 'MI',
          },
          url: eventUrl,
          source: SOURCE,
          category: categorizeEventByContent(title, description),
          isRecurring: allDates.length > 1 || detectRecurringEvent(title, description, blockText),
          isFree: detectFreeEvent(title, description, combined),
          scrapedAt,
        };
        if (end) ev.endDateTime = toISODateTime(date, end);
        events.push(ev);
      }
    });

    return createScrapeResult(SOURCE, events);
  } catch (e) {
    return createScrapeResult(SOURCE, [], e.message);
  }
}

// =============================================================================
// Ada Township: Parks & Recreation Events Page
// =============================================================================

async function scrapeAdaTownshipParks() {
  const SOURCE = 'ada-township-parks';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const currentYear = new Date().getFullYear();

  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];

    // The Parks & Rec page uses a loose inline structure where each event
    // title is wrapped in <strong> and followed by inline prose + a
    // "Date: ... Time: ... Location: ... Cost: ..." stanza. Event titles
    // can appear twice in the DOM because of nested styling tags, so we
    // dedupe on the title text itself. We then locate each title's position
    // in the flattened body text and extract the chunk up to the next title.
    const bodyText = cleanText($('main, #primary, .main-content, body').first().text());

    // Collect candidate event titles from <strong> elements. We keep anything
    // that looks like a short proper-noun phrase and drop generic navigation
    // labels, vendor names, and section headings.
    const titleCandidates = [];
    const seenTitleText = new Set();
    $('strong, b').each((_, el) => {
      const raw = cleanText($(el).text()).replace(/\s*\(\d+\)\s*$/, '');
      if (!raw || raw.length < 4 || raw.length > 100) return;
      if (seenTitleText.has(raw.toLowerCase())) return;
      // Exclude generic/section headers and label-like text
      if (/^(community events|events|programs|parks|cost|date|time|location|menu|website|vendor list|read more|related pages|facebook page|click here|home|government|departments|community|services|how do i)\b/i.test(raw)) return;
      // Exclude vendor parentheticals (e.g. "Around Baking Company (Pizza & Sweets)")
      if (/^[A-Z][A-Za-z0-9 &'’\-]+\s*\([^)]+\)$/.test(raw)) return;
      seenTitleText.add(raw.toLowerCase());
      titleCandidates.push(raw);
    });

    // Locate each title in the body text (first occurrence only).
    const titleHits = [];
    for (const t of titleCandidates) {
      const idx = bodyText.indexOf(t);
      if (idx >= 0) titleHits.push({ title: t, idx });
    }
    // Sort by position so each event's chunk runs up to the next title.
    titleHits.sort((a, b) => a.idx - b.idx);

    const seen = new Set();
    for (let i = 0; i < titleHits.length; i++) {
      const { title, idx } = titleHits[i];
      const nextIdx = i + 1 < titleHits.length ? titleHits[i + 1].idx : bodyText.length;
      const chunk = bodyText.slice(idx + title.length, nextIdx);

      // Require a "Date:" marker in this chunk, otherwise it's not a dated event
      // (could be a vendor block, sponsor list, etc.).
      if (!/\bDate:\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)/i.test(chunk)) continue;

      const dateLine = chunk.match(/Date:\s*([^]{0,100}?)(?=\s*(?:Time:|Location:|Cost:|$))/i);
      const dateText = dateLine ? dateLine[1] : chunk;
      const date = extractTownshipDate(dateText, currentYear);
      if (!date) continue;

      const timeLine = chunk.match(/Time:\s*([^]{0,100}?)(?=\s*(?:Location:|Cost:|Date:|$))/i);
      const { time, end } = extractTownshipTime(timeLine ? timeLine[1] : chunk);

      const locationLine = chunk.match(/Location:\s*([^]{0,120}?)(?=\s*(?:Cost:|Date:|Time:|$))/i);
      const locationName = locationLine ? cleanText(locationLine[1]) : 'Ada Township';

      // Description: the prose in this chunk that precedes "Date:"
      let description = chunk.split(/\bDate:/i)[0].trim();
      if (description.length > 500) description = description.substring(0, 497) + '...';

      const id = generateEventId(SOURCE, title, date);
      if (seen.has(id)) continue;
      seen.add(id);

      const combined = `${title} ${description} ${chunk}`;
      const ev = {
        id,
        title,
        description: description || `Ada Township Parks & Recreation event: ${title}`,
        date,
        time,
        startDateTime: toISODateTime(date, time),
        location: {
          name: locationName,
          address: /Ada Park/i.test(locationName) ? '1180 Buttrick Avenue SE' : '',
          city: 'Ada',
          state: 'MI',
        },
        url: config.url,
        source: SOURCE,
        category: categorizeEventByContent(title, description),
        isRecurring: detectRecurringEvent(title, description, combined),
        isFree: /Free/i.test(chunk) || detectFreeEvent(title, description, combined),
        scrapedAt,
      };
      if (end) ev.endDateTime = toISODateTime(date, end);
      events.push(ev);
    }

    return createScrapeResult(SOURCE, events);
  } catch (e) {
    return createScrapeResult(SOURCE, [], e.message);
  }
}

// =============================================================================
// Ada Farmers Market: generate recurring Tuesday entries for the active season
// =============================================================================

function scrapeAdaFarmersMarket() {
  const SOURCE = 'ada-farmers-market';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const events = [];

  // Official season: Tuesdays, 9am–2pm, early June through end of October.
  // We generate Tuesdays from the first Tuesday of June through the last Tuesday of October
  // for the current year so the calendar reflects the season without brittle scraping.
  const year = new Date().getFullYear();
  const start = new Date(year, 5, 1); // June 1
  const end = new Date(year, 9, 31);  // October 31

  // Advance to first Tuesday
  while (start.getDay() !== 2) start.setDate(start.getDate() + 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
    if (d < today) continue;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const date = `${y}-${m}-${day}`;
    events.push({
      id: generateEventId(SOURCE, 'Ada Farmers Market', date),
      title: 'Ada Farmers Market',
      description: 'Local farmers, bakers, and artisans gather along the Thornapple River every Tuesday from June through October, 9am–2pm.',
      date,
      time: '9:00 AM',
      startDateTime: toISODateTime(date, '9:00 AM'),
      endDateTime: toISODateTime(date, '2:00 PM'),
      location: {
        name: 'Ada Farmers Market',
        address: '7239 Thornapple River Dr',
        city: 'Ada',
        state: 'MI',
        zip: '49301',
      },
      url: config.url,
      source: SOURCE,
      category: 'other',
      isRecurring: true,
      isFree: true,
      scrapedAt,
    });
  }

  return createScrapeResult(SOURCE, events);
}

// =============================================================================
// Amy Van Andel Library: BiblioCommons events API filtered to the ADA branch
// =============================================================================

async function scrapeAmyVanAndelLibrary() {
  const SOURCE = 'amy-van-andel-library';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const BRANCH_CODE = 'ADA';
  const BRANCH_NAME = 'Amy Van Andel Library';
  const BRANCH_ADDRESS = '7215 Headley St SE';

  try {
    const adaEvents = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 40) {
      const apiUrl = `https://gateway.bibliocommons.com/v2/libraries/kdl/events?limit=100&page=${page}`;
      const resp = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'AdaEventsCalendar/1.0' },
      });
      if (!resp.ok) throw new Error(`KDL API ${resp.status}`);
      const data = await resp.json();

      const pagination = data.events?.pagination || {};
      totalPages = pagination.pages || 1;
      const entities = data.entities?.events || {};
      const items = data.events?.items || [];

      for (const id of items) {
        const ev = entities[id];
        if (!ev) continue;
        const def = ev.definition || {};
        if (def.branchLocationId !== BRANCH_CODE) continue;
        if (def.isCancelled) continue;
        if (!def.start) continue;

        const startIso = def.start;
        const dateOnly = startIso.split('T')[0];
        const evDate = new Date(`${dateOnly}T12:00:00`);
        if (evDate < today) continue;

        const title = cleanText(def.title || '');
        if (!title || title.length < 3) continue;
        const description = cleanText(stripHtml(decodeHtmlEntities(def.description || '')));

        const [, timePart = ''] = startIso.split('T');
        const [hStr = '', mStr = ''] = timePart.split(':');
        let displayTime = 'TBD';
        if (hStr && mStr) {
          const h = parseInt(hStr, 10);
          const min = mStr.padStart(2, '0');
          if (!isNaN(h)) {
            const period = h >= 12 ? 'PM' : 'AM';
            const hour12 = h % 12 === 0 ? 12 : h % 12;
            displayTime = `${hour12}:${min} ${period}`;
          }
        }

        const pageSlug = `${dateOnly}T${(timePart || '00:00').substring(0, 5)}:00`;
        const detailUrl = `https://kdl.bibliocommons.com/events/${id}`;

        const event = {
          id: generateEventId(SOURCE, title, dateOnly),
          title,
          description: description || 'Library event at the Amy Van Andel Library in Ada.',
          date: dateOnly,
          time: displayTime,
          startDateTime: toISODateTime(dateOnly, displayTime),
          location: {
            name: BRANCH_NAME,
            address: BRANCH_ADDRESS,
            city: 'Ada',
            state: 'MI',
            zip: '49301',
          },
          url: detailUrl,
          source: SOURCE,
          category: categorizeEventByContent(title, description),
          isRecurring: Boolean(ev.seriesId) || detectRecurringEvent(title, description),
          isFree: true,
          scrapedAt,
        };
        if (def.end) {
          const [endDate, endTimePart = ''] = def.end.split('T');
          if (endDate === dateOnly && endTimePart) {
            const [ehStr = '', emStr = ''] = endTimePart.split(':');
            const eh = parseInt(ehStr, 10);
            if (!isNaN(eh)) {
              const period = eh >= 12 ? 'PM' : 'AM';
              const hour12 = eh % 12 === 0 ? 12 : eh % 12;
              const endDisplay = `${hour12}:${emStr.padStart(2, '0')} ${period}`;
              event.endDateTime = toISODateTime(dateOnly, endDisplay);
            }
          }
        }
        adaEvents.push(event);
      }

      page++;
    }

    // Deduplicate by id (same event may appear twice if API returns duplicates across pages)
    const unique = Array.from(new Map(adaEvents.map(e => [e.id, e])).values());
    console.log(`    Found ${unique.length} Amy Van Andel Library events (from ${totalPages} KDL pages)`);
    return createScrapeResult(SOURCE, unique);
  } catch (e) {
    return createScrapeResult(SOURCE, [], e.message);
  }
}

// =============================================================================
// Discover Ada (discoverada.com)
// =============================================================================

async function scrapeDiscoverAda() {
  const SOURCE = 'discover-ada';
  const config = SOURCE_CONFIG[SOURCE];
  const scrapedAt = new Date().toISOString();
  const now = new Date();
  const currentYear = now.getFullYear();

  // adavillage.com is a Wix site. Its events section has two shapes:
  //   1) Calendar cards: <h3>DAY</h3><h5>MONTH</h5><h4>TITLE</h4> + a "Details" link
  //   2) A text block starting with "Other events:" that lists one event per
  //      zero-width-space-separated line, e.g. "Restaurant Week: May 17 -23rd, Ada"
  // We parse both and let the top-level dedupe handle overlap with other sources.

  try {
    const html = await fetchHtml(config.url, 15000);
    const $ = loadHtml(html);
    const events = [];
    const seen = new Set();

    const inferYear = (month, day) => {
      const d = new Date(`${currentYear}-${month}-${String(day).padStart(2, '0')}T12:00:00`);
      // Allow up to 60 days in the past before rolling to next year
      return (now - d) > 60 * 24 * 60 * 60 * 1000 ? currentYear + 1 : currentYear;
    };

    // --- Shape 1: calendar cards ---
    // Cards are rendered as three adjacent headings in document order:
    //   h3 = day (e.g. "23"), h5 = month ("April"), h4 = title.
    // They're not DOM siblings (each heading is wrapped in its own div), so we
    // collect headings in document order and scan for the triple.
    const orderedHeadings = [];
    $('h3, h4, h5').each((_, el) => {
      const text = cleanText($(el).text());
      if (text) orderedHeadings.push({ tag: el.tagName.toLowerCase(), text });
    });

    for (let i = 0; i < orderedHeadings.length - 2; i++) {
      const a = orderedHeadings[i];
      const b = orderedHeadings[i + 1];
      const c = orderedHeadings[i + 2];
      if (a.tag !== 'h3' || b.tag !== 'h5' || c.tag !== 'h4') continue;
      if (!/^\d{1,2}$/.test(a.text)) continue;
      const month = MONTHS[b.text.toLowerCase()];
      if (!month) continue;
      const day = parseInt(a.text, 10);
      if (day < 1 || day > 31) continue;
      const title = c.text;
      if (!title || title.length < 3 || title.length > 140) continue;

      const year = inferYear(month, day);
      const date = `${year}-${month}-${String(day).padStart(2, '0')}`;

      const id = generateEventId(SOURCE, title, date);
      if (seen.has(id)) continue;
      seen.add(id);

      events.push({
        id,
        title,
        description: `Featured event in Ada Village.`,
        date,
        time: 'TBA',
        startDateTime: toISODateTime(date, 'TBA'),
        location: { name: 'Ada Village', address: '', city: 'Ada', state: 'MI' },
        url: config.url,
        source: SOURCE,
        category: categorizeEventByContent(title, ''),
        isRecurring: detectRecurringEvent(title, ''),
        isFree: detectFreeEvent(title, ''),
        scrapedAt,
      });
    }

    // --- Shape 2: "Other events:" text block ---
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    const otherIdx = bodyText.indexOf('Other events:');
    if (otherIdx >= 0) {
      // The block ends before the next section marker
      const endMarker = /(#discoverada|join our|NEWSLETTER|bottom of page)/i.exec(bodyText.slice(otherIdx));
      const endIdx = endMarker ? otherIdx + endMarker.index : otherIdx + 4000;
      const chunk = bodyText.slice(otherIdx + 'Other events:'.length, endIdx);
      // Lines are separated by zero-width spaces in this Wix template
      const lines = chunk.split(/\u200B+/).map(s => s.trim()).filter(Boolean);

      for (const line of lines) {
        // Expect pattern: "<Title>: <Date info>, <Location>"
        const m = line.match(/^([^:]+?):\s*(.+)$/);
        if (!m) continue;
        const title = cleanText(m[1]);
        const rest = m[2];
        if (!title || title.length < 3 || title.length > 120) continue;

        // Try to extract one or more dates. For ranges like "May 17 -23rd" we
        // only record the start date. For recurring series like "Tuesdays,
        // June 2nd - October 27th" we record the first listed date.
        const dateCandidates = extractAllTownshipDates(rest, currentYear);
        let date = dateCandidates[0];
        if (!date) {
          // Fallback: pattern "Month <ordinal>" e.g. "June 7th"
          const ord = rest.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
          if (ord) {
            const mm = MONTHS[ord[1].toLowerCase()];
            if (mm) {
              const d = parseInt(ord[2], 10);
              const y = inferYear(mm, d);
              date = `${y}-${mm}-${String(d).padStart(2, '0')}`;
            }
          }
        }
        if (!date) continue;

        // Location is everything after the last comma
        const parts = rest.split(',').map(s => s.trim()).filter(Boolean);
        const locationName = parts.length >= 2 ? parts[parts.length - 1] : 'Ada, MI';

        const id = generateEventId(SOURCE, title, date);
        if (seen.has(id)) continue;
        seen.add(id);

        events.push({
          id,
          title,
          description: `Listed on Discover Ada: ${rest}`.slice(0, 500),
          date,
          time: 'TBA',
          startDateTime: toISODateTime(date, 'TBA'),
          location: { name: locationName, address: '', city: 'Ada', state: 'MI' },
          url: config.url,
          source: SOURCE,
          category: categorizeEventByContent(title, rest),
          isRecurring: /Tuesdays|Wednesdays|Thursdays|weekly|recurring|series/i.test(rest) || detectRecurringEvent(title, rest),
          isFree: detectFreeEvent(title, rest),
          scrapedAt,
        });
      }
    }

    if (events.length === 0) {
      return createScrapeResult(SOURCE, [], 'No events parseable from Ada Village homepage');
    }
    return createScrapeResult(SOURCE, events);
  } catch (e) {
    return createScrapeResult(SOURCE, [], e.message);
  }
}

// =============================================================================
// Geocoding (shared cache with GR scraper)
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

// Ada-area venues with known coordinates. Anything not matched falls back to
// the Nominatim API with a 1.5s delay between calls.
const KNOWN_VENUES = {
  'ada park': { lat: 42.9483, lng: -85.4965 },
  'ada township': { lat: 42.9606, lng: -85.4936 },
  'legacy park': { lat: 42.9599, lng: -85.4927 },
  'amy van andel library': { lat: 42.9605, lng: -85.4918 },
  'ada christian school': { lat: 42.9527, lng: -85.4969 },
  'amway world headquarters': { lat: 42.9530, lng: -85.4867 },
  'amway': { lat: 42.9530, lng: -85.4867 },
  'aba office': { lat: 42.9608, lng: -85.4902 },
  'worklab ada': { lat: 42.9611, lng: -85.4907 },
  'bgr event center': { lat: 43.0386, lng: -85.6700 },
  'battlegr': { lat: 43.0386, lng: -85.6700 },
  'ada farmers market': { lat: 42.9595, lng: -85.4924 },
  'ada village': { lat: 42.9603, lng: -85.4903 },
  'ada community center': { lat: 42.9605, lng: -85.4918 },
  'gravel bottom craft brewery': { lat: 42.9522, lng: -85.4889 },
  'gravel bottom': { lat: 42.9522, lng: -85.4889 },
};

function getKnownVenueCoords(venueName) {
  const normalized = (venueName || '').toLowerCase().trim();
  if (!normalized) return null;
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
  if (cacheKey in geocodeCache) return geocodeCache[cacheKey];

  const query = [address, city, state, 'USA'].filter(Boolean).join(', ');
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    const resp = await fetch(url.toString(), {
      headers: { 'User-Agent': 'AdaEventsCalendar/1.0', 'Accept': 'application/json' },
    });
    if (!resp.ok) throw new Error(`Nominatim ${resp.status}`);
    const data = await resp.json();
    if (data.length === 0) {
      geocodeCache[cacheKey] = null;
      await saveGeoCache();
      return null;
    }
    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    geocodeCache[cacheKey] = result;
    await saveGeoCache();
    return result;
  } catch (err) {
    console.error(`Geocoding error for "${query}": ${err.message}`);
    return null;
  }
}

async function geocodeEvent(event) {
  if (event.location.lat && event.location.lng) return event;
  const known = getKnownVenueCoords(event.location.name);
  if (known) {
    return { ...event, location: { ...event.location, ...known } };
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
  const out = [];
  let apiCalls = 0;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const needsApiCall = !event.location.lat && !event.location.lng &&
      !getKnownVenueCoords(event.location.name);
    const geocoded = await geocodeEvent(event);
    out.push(geocoded);
    if (onProgress) onProgress(i + 1, events.length);
    if (needsApiCall && i < events.length - 1) {
      apiCalls++;
      await delay(1500);
    }
  }
  console.log(`  Geocoding complete: ${apiCalls} API calls made`);
  return out;
}

// =============================================================================
// Main
// =============================================================================

async function runFullScrape() {
  const scrapers = [
    { name: 'Ada Business Association', fn: scrapeAdaBusinessAssociation },
    { name: 'Ada Township Community', fn: scrapeAdaTownshipCommunity },
    { name: 'Ada Township Parks & Rec', fn: scrapeAdaTownshipParks },
    { name: 'Ada Farmers Market', fn: async () => scrapeAdaFarmersMarket() },
    { name: 'Amy Van Andel Library', fn: scrapeAmyVanAndelLibrary },
    { name: 'Discover Ada', fn: scrapeDiscoverAda },
  ];

  const results = [];
  const allEvents = [];
  const sources = {};

  for (const s of scrapers) {
    console.log(`Scraping ${s.name}...`);
    const result = await s.fn();
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
    await delay(800);
  }

  const unique = Array.from(new Map(allEvents.map(e => [e.id, e])).values());
  unique.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  return { events: unique, sources, results };
}

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Ada Events Calendar - Scraper       ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');

  const forceRun = process.argv.includes('--force');
  if (!forceRun) {
    try {
      const existing = await fs.readFile(DATA_FILE, 'utf-8');
      const { lastScraped } = JSON.parse(existing);
      if (lastScraped) {
        const hours = (new Date() - new Date(lastScraped)) / (1000 * 60 * 60);
        if (hours < 24) {
          console.log(`⏳ Last scrape was ${Math.floor(hours)} hours ago.`);
          console.log(`   Limited to once per day. Use --force to override.`);
          process.exit(0);
        }
      }
    } catch {
      // fall through
    }
  } else {
    console.log('⚠️  Force flag detected - bypassing 24-hour limit');
    console.log('');
  }

  try {
    console.log('Starting scrape...');
    console.log('');

    const { events, sources } = await runFullScrape();
    console.log('');
    console.log(`Total: ${events.length} unique events from ${Object.keys(sources).length} sources`);
    console.log('');

    console.log('Geocoding events...');
    const geocoded = await geocodeEvents(events, (completed, total) => {
      if (completed % 10 === 0 || completed === total) {
        process.stdout.write(`  Progress: ${completed}/${total}\r`);
      }
    });
    console.log('');

    const data = {
      events: geocoded,
      lastScraped: new Date().toISOString(),
      sources,
    };

    console.log('Saving to src/data/ada-events.json...');
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
