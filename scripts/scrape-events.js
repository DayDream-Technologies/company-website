#!/usr/bin/env node
/**
 * GR Events Calendar - Scrape Script
 * 
 * This Node.js script scrapes events from various sources and saves them to src/data/events.json.
 * Run with: node scripts/scrape-events.js
 */

const fs = require('fs').promises;
const path = require('path');

// Try to import cheerio (for HTML parsing)
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
  'msu-foundation': {
    id: 'msu-foundation',
    name: 'MSU Foundation',
    url: 'https://msufoundation.org/events/',
    color: '#18453B',
  },
  'start-garden': {
    id: 'start-garden',
    name: 'Start Garden',
    url: 'https://startgarden.com/events/',
    color: '#FF6B35',
  },
  'bamboo': {
    id: 'bamboo',
    name: 'Bamboo Cowork',
    url: 'https://www.bamboocowork.com/events-at-bamboo',
    color: '#4CAF50',
  },
  'grand-rapids-org': {
    id: 'grand-rapids-org',
    name: 'GR Chamber of Commerce',
    url: 'https://grandrapids.org/events/',
    color: '#2196F3',
  },
  'gr-junior-chamber': {
    id: 'gr-junior-chamber',
    name: 'GR Junior Chamber',
    url: 'https://www.grjuniorchamber.com/',
    color: '#9C27B0',
  },
  'right-place': {
    id: 'right-place',
    name: 'The Right Place',
    url: 'https://www.rightplace.org/events/',
    color: '#1E3A5F',
  },
};

// Updated paths for new location
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'events.json');
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
  
  // Try month name format: "Jan 20, 2026" or "January 20, 2026"
  const monthMatch = cleaned.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthMatch) {
    const month = MONTHS[monthMatch[1].toLowerCase()];
    if (month) {
      const day = monthMatch[2].padStart(2, '0');
      return `${monthMatch[3]}-${month}-${day}`;
    }
  }

  // Try MM/DD/YYYY format
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    return `${slashMatch[3]}-${month}-${day}`;
  }

  // Try ISO format
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Try native Date parsing as fallback
  try {
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    // Ignore parsing errors
  }

  return null;
}

function parseTime(timeStr) {
  if (!timeStr) return 'TBD';
  
  const cleaned = timeStr.trim().replace(/\s+/g, ' ');
  
  // Already in good format like "10:00 AM"
  if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }
  
  // Format like "10:00am" (no space)
  const noSpaceMatch = cleaned.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (noSpaceMatch) {
    return `${noSpaceMatch[1]}:${noSpaceMatch[2]} ${noSpaceMatch[3].toUpperCase()}`;
  }
  
  // Format like "10am" or "10 am"
  const hourOnlyMatch = cleaned.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (hourOnlyMatch) {
    return `${hourOnlyMatch[1]}:00 ${hourOnlyMatch[2].toUpperCase()}`;
  }
  
  // 24-hour format like "14:00"
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

// =============================================================================
// Recurring Event Detection
// =============================================================================

// Known recurring event titles (case-insensitive partial matches)
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
];

// Patterns that indicate a recurring event
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

/**
 * Detect if an event is recurring based on title, description, and other metadata
 * @param {string} title - Event title
 * @param {string} description - Event description
 * @param {string} timeText - Time text that might contain frequency info
 * @returns {boolean} - True if the event appears to be recurring
 */
function detectRecurringEvent(title, description = '', timeText = '') {
  const combinedText = `${title} ${description} ${timeText}`.toLowerCase();
  
  // Check against known recurring event titles
  for (const knownTitle of KNOWN_RECURRING_EVENTS) {
    if (combinedText.includes(knownTitle)) {
      return true;
    }
  }
  
  // Check against recurring patterns
  for (const pattern of RECURRING_PATTERNS) {
    if (pattern.test(combinedText)) {
      return true;
    }
  }
  
  return false;
}

// =============================================================================
// Free Event Detection
// =============================================================================

/**
 * Detect if an event is free based on title, description, and other metadata
 * @param {string} title - Event title
 * @param {string} description - Event description
 * @param {string} extraText - Additional text (e.g., event type badges, button text)
 * @returns {boolean} - True if the event appears to be free
 */
function detectFreeEvent(title, description = '', extraText = '') {
  const text = `${title} ${description} ${extraText}`.toLowerCase();
  
  // Definitely NOT free - membership required
  if (text.includes('members only') || text.includes('member only')) return false;
  if (text.includes('private event')) return false;
  
  // Definitely NOT free - tickets/payment required
  if (text.includes('get tickets') || text.includes('buy tickets')) return false;
  if (text.includes('purchase tickets')) return false;
  if (/\$\d+/.test(text)) return false; // Has dollar amount like $25
  if (text.includes('registration fee') || text.includes('admission fee')) return false;
  if (text.includes('ticket price') || text.includes('event fee')) return false;
  if (text.includes('paid event')) return false;
  
  // Explicitly free
  if (text.includes('free event') || text.includes('free admission')) return true;
  if (text.includes('no cost') || text.includes('no charge') || text.includes('no fee')) return true;
  if (/\bfree\b/.test(text) && !text.includes('free parking')) return true;
  
  // Public events without ticket mentions are typically free
  if (text.includes('public event') && !text.includes('ticket')) return true;
  
  // Community/coworking events are typically free
  if (text.includes('community coworking')) return true;
  if (text.includes('open house') && !text.includes('ticket')) return true;
  
  // Default: assume free if no cost indicators found
  return true;
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
// Scrapers
// =============================================================================

async function scrapeMsuFoundation() {
  const SOURCE = 'msu-foundation';
  const config = SOURCE_CONFIG[SOURCE];
  
  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const scrapedAt = new Date().toISOString();

    const eventSelectors = [
      '.event-item', '.event-card', '[class*="event"]',
      '.tribe-events-calendar-list__event', 'article.event', '.eventbrite-event',
    ];

    let eventElements = $();
    for (const selector of eventSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        eventElements = found;
        break;
      }
    }

    if (eventElements.length === 0) {
      $('a[href*="event"]').each((_, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '';
        const text = cleanText($el.text());
        
        if (text.length < 5 || text.toLowerCase().includes('view all')) return;
        
        const parent = $el.closest('div, article, section, li');
        const dateText = parent.find('[class*="date"], time, .date').first().text();
        const date = parseDate(dateText) || parseDate(text);
        
        if (date && text) {
          events.push({
            id: generateEventId(SOURCE, text, date),
            title: text,
            description: '',
            date,
            time: 'TBD',
            startDateTime: toISODateTime(date, '00:00 AM'),
            location: {
              name: 'MSU Foundation',
              address: '325 E. Grand River Ave.',
              city: 'East Lansing',
              state: 'MI',
            },
            url: href.startsWith('http') ? href : `https://msufoundation.org${href}`,
            source: SOURCE,
            isRecurring: detectRecurringEvent(text, ''),
            isFree: detectFreeEvent(text, ''),
            scrapedAt,
          });
        }
      });
    } else {
      eventElements.each((_, el) => {
        const $el = $(el);
        
        const title = cleanText($el.find('h2, h3, h4, .event-title, .title').first().text());
        const description = cleanText($el.find('p, .description, .event-description').first().text());
        const dateText = cleanText($el.find('.date, time, [class*="date"]').first().text());
        const timeText = cleanText($el.find('.time, [class*="time"]').first().text());
        const link = $el.find('a').first().attr('href') || '';
        
        const date = parseDate(dateText);
        const time = parseTime(timeText);
        
        if (title && date) {
          events.push({
            id: generateEventId(SOURCE, title, date),
            title,
            description,
            date,
            time,
            startDateTime: toISODateTime(date, time),
            location: {
              name: 'MSU Foundation',
              address: '325 E. Grand River Ave.',
              city: 'East Lansing',
              state: 'MI',
            },
            url: link.startsWith('http') ? link : `https://msufoundation.org${link}`,
            source: SOURCE,
            isRecurring: detectRecurringEvent(title, description, timeText),
            isFree: detectFreeEvent(title, description),
            scrapedAt,
          });
        }
      });
    }

    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeStartGarden() {
  const SOURCE = 'start-garden';
  const config = SOURCE_CONFIG[SOURCE];
  
  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const scrapedAt = new Date().toISOString();

    const eventSelectors = [
      '.event', '.event-item', '.event-card', '[class*="event-"]',
      '.tribe-events-calendar-list__event', 'article',
    ];

    let eventElements = $();
    for (const selector of eventSelectors) {
      const found = $(selector).filter((_, el) => {
        const $el = $(el);
        return $el.find('h1, h2, h3, h4, .title').length > 0;
      });
      if (found.length > 0) {
        eventElements = found;
        break;
      }
    }

    eventElements.each((_, el) => {
      const $el = $(el);
      
      const title = cleanText($el.find('h1, h2, h3, h4, .event-title, .title').first().text());
      if (!title || title.length < 3) return;
      
      const description = cleanText($el.find('p, .description, .event-description, .excerpt').first().text());
      let dateText = cleanText(
        $el.find('.date, time, [class*="date"], .event-date').first().text() ||
        $el.find('[datetime]').attr('datetime') || ''
      );
      const timeText = cleanText($el.find('.time, [class*="time"], .event-time').first().text());
      const link = $el.find('a').first().attr('href') || $el.closest('a').attr('href') || '';
      const locationText = cleanText($el.find('.location, .venue, [class*="location"], .event-location').first().text());
      
      const date = parseDate(dateText);
      const time = parseTime(timeText);
      
      if (title && date) {
        events.push({
          id: generateEventId(SOURCE, title, date),
          title,
          description,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: {
            name: locationText || 'Start Garden',
            address: '40 Pearl St NW',
            city: 'Grand Rapids',
            state: 'MI',
            zip: '49503',
          },
          url: link.startsWith('http') ? link : `https://startgarden.com${link}`,
          source: SOURCE,
          isRecurring: detectRecurringEvent(title, description, timeText),
          isFree: detectFreeEvent(title, description),
          scrapedAt,
        });
      }
    });

    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeBamboo() {
  const SOURCE = 'bamboo';
  const config = SOURCE_CONFIG[SOURCE];
  
  function parseLocation(fullText) {
    // Look for location keywords in the full text of the event card
    const lower = (fullText || '').toLowerCase();
    
    // Check for specific location mentions
    if (lower.includes('grand rapids')) return { name: 'Bamboo Grand Rapids', city: 'Grand Rapids' };
    if (lower.includes('ann arbor')) return { name: 'Bamboo Ann Arbor', city: 'Ann Arbor' };
    if (lower.includes('downtown detroit') || lower.includes('detroit') && !lower.includes('midtown')) return { name: 'Bamboo Downtown Detroit', city: 'Detroit' };
    if (lower.includes('midtown')) return { name: 'Bamboo Midtown Detroit', city: 'Detroit' };
    if (lower.includes('royal oak')) return { name: 'Bamboo Royal Oak', city: 'Royal Oak' };
    
    return { name: 'Bamboo Cowork', city: 'Unknown' };
  }
  
  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const scrapedAt = new Date().toISOString();
    const seenTitles = new Set();

    // Webflow uses w-dyn-item for collection items
    // Also try other common Webflow patterns
    const eventSelectors = [
      '.w-dyn-item',
      '[class*="collection-item"]',
      '[class*="event-card"]',
      '[class*="event_card"]',
      '.event-item',
    ];

    let eventElements = $();
    for (const selector of eventSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        eventElements = found;
        console.log(`    Found ${found.length} elements with selector: ${selector}`);
        break;
      }
    }
    
    // If no collection items found, try finding by link pattern
    if (eventElements.length === 0) {
      console.log('    No collection items found, trying link-based approach');
      $('a[href*="/events-at-bamboo/"]').each((_, el) => {
        const $link = $(el);
        const href = $link.attr('href') || '';
        
        // Skip the main events page link
        if (href === '/events-at-bamboo' || href === '/events-at-bamboo/') return;
        
        // Get parent container
        const $parent = $link.closest('div').parent().closest('div');
        if ($parent.length > 0) {
          eventElements = eventElements.add($parent);
        }
      });
      console.log(`    Found ${eventElements.length} events via link pattern`);
    }

    eventElements.each((_, el) => {
      const $el = $(el);
      const fullText = $el.text();
      
      // Get title
      const title = cleanText(
        $el.find('h2, h3, h4, h5, [class*="title"], [class*="heading"], [class*="name"]').first().text()
      );
      
      if (!title || title.length < 3 || title.length > 200) return;
      
      // Skip duplicates and navigation items
      if (seenTitles.has(title)) return;
      if (['Events', 'Filters', 'View details', 'Book a tour', 'Contact us'].includes(title)) return;
      
      // Get description
      const description = cleanText(
        $el.find('p, [class*="description"], [class*="excerpt"], [class*="summary"]').first().text()
      );
      
      // Extract date from full text - format: "Jan 13, 2026 9:00 AM" or "Feb 4, 2026 8:30 AM"
      const dateMatch = fullText.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
      if (!dateMatch) return;
      
      const month = MONTHS[dateMatch[1].toLowerCase()];
      if (!month) return;
      
      const day = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      const date = `${year}-${month}-${day}`;
      
      // Extract time
      const timeMatch = fullText.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
      const time = timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3]}`) : 'TBD';
      
      // Parse location from full text
      const location = parseLocation(fullText);
      
      // Get link
      let link = $el.find('a[href*="/events-at-bamboo/"]').first().attr('href') || 
                 $el.find('a').first().attr('href') || '';
      
      if (link && !link.startsWith('http')) {
        link = `https://www.bamboocowork.com${link.startsWith('/') ? '' : '/'}${link}`;
      }
      
      // Check for event type badges (Public Event, Members Only, Private Event)
      const eventTypeBadge = cleanText(
        $el.find('[class*="tag"], [class*="badge"], [class*="label"], [class*="category"], [class*="type"]').text()
      );
      
      // Determine if free - Members Only and Private Event are NOT free
      const isFree = !eventTypeBadge.toLowerCase().includes('members only') &&
                     !eventTypeBadge.toLowerCase().includes('private') &&
                     !fullText.toLowerCase().includes('members only') &&
                     !fullText.toLowerCase().includes('private event');
      
      seenTitles.add(title);
      
      events.push({
        id: generateEventId(SOURCE, title, date),
        title,
        description: description || '',
        date,
        time,
        startDateTime: toISODateTime(date, time),
        location: {
          name: location.name,
          address: location.city === 'Grand Rapids' ? '38 Commerce Ave SW' : '',
          city: location.city,
          state: 'MI',
        },
        url: link || config.url,
        source: SOURCE,
        isRecurring: detectRecurringEvent(title, description, fullText),
        isFree,
        scrapedAt,
      });
    });

    // Filter to only include Grand Rapids events
    const grEvents = events.filter(e => {
      return e.location.city.toLowerCase() === 'grand rapids';
    });
    
    console.log(`    Total events found: ${events.length}, Grand Rapids events: ${grEvents.length}`);

    return createScrapeResult(SOURCE, grEvents);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeGrandRapidsOrg() {
  const SOURCE = 'grand-rapids-org';
  const config = SOURCE_CONFIG[SOURCE];
  
  function categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('network') || text.includes('mixer')) return 'networking';
    if (text.includes('workshop') || text.includes('training')) return 'workshop';
    if (text.includes('conference') || text.includes('summit')) return 'conference';
    if (text.includes('meetup')) return 'meetup';
    if (text.includes('pitch') || text.includes('startup')) return 'pitch';
    return 'other';
  }
  
  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const scrapedAt = new Date().toISOString();

    const eventSelectors = [
      '.event', '.event-item', '.event-card', '[class*="event-"]',
      '.listing-item', 'article.event', '.tribe-events-calendar-list__event',
    ];

    let eventElements = $();
    for (const selector of eventSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        eventElements = found;
        break;
      }
    }

    eventElements.each((_, el) => {
      const $el = $(el);
      
      const title = cleanText($el.find('h2, h3, h4, .event-title, .title, [itemprop="name"]').first().text());
      if (!title || title.length < 3) return;
      
      const description = cleanText($el.find('p, .description, .event-description, [itemprop="description"]').first().text());
      
      let dateText = $el.find('[itemprop="startDate"]').attr('content') ||
                     $el.find('[datetime]').attr('datetime') ||
                     cleanText($el.find('.date, time, [class*="date"]').first().text());
      
      const timeText = cleanText($el.find('.time, [class*="time"]').first().text());
      const link = $el.find('a').first().attr('href') || $el.attr('href') || '';
      
      const locationName = cleanText($el.find('[itemprop="location"], .venue, .location-name').first().text());
      const locationAddress = cleanText($el.find('[itemprop="address"], .address, .location-address').first().text());
      
      const date = parseDate(dateText);
      const time = parseTime(timeText);
      
      if (title && date) {
        const category = categorizeEvent(title, description);
        
        events.push({
          id: generateEventId(SOURCE, title, date),
          title,
          description,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: {
            name: locationName || 'Grand Rapids',
            address: locationAddress || '',
            city: 'Grand Rapids',
            state: 'MI',
          },
          url: link.startsWith('http') ? link : `https://grandrapids.org${link}`,
          source: SOURCE,
          category,
          isRecurring: detectRecurringEvent(title, description, timeText),
          isFree: detectFreeEvent(title, description),
          scrapedAt,
        });
      }
    });

    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeGrJuniorChamber() {
  const SOURCE = 'gr-junior-chamber';
  const config = SOURCE_CONFIG[SOURCE];
  
  function categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('network') || text.includes('mixer') || text.includes('happy hour') || text.includes('exchange')) return 'networking';
    if (text.includes('workshop') || text.includes('training') || text.includes('leadership')) return 'workshop';
    if (text.includes('conference') || text.includes('summit') || text.includes('celebration') || text.includes('gala') || text.includes('awards')) return 'conference';
    if (text.includes('meetup') || text.includes('connect')) return 'meetup';
    if (text.includes('pitch') || text.includes('startup') || text.includes('entrepreneur')) return 'pitch';
    return 'other';
  }
  
  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const scrapedAt = new Date().toISOString();

    // Primary selector - Wix Events widget uses data-hook="event-list-item"
    let eventElements = $('[data-hook="event-list-item"]');
    
    if (eventElements.length > 0) {
      console.log(`    Found ${eventElements.length} events using Wix Events widget selector`);
    }
    
    // Fallback selectors if primary doesn't work
    if (eventElements.length === 0) {
      const fallbackSelectors = [
        'li.FwdPeD',  // Wix event list item class
        '[data-hook="events-card"]',
        '[data-testid="event-list-item"]',
      ];
      
      for (const selector of fallbackSelectors) {
        const found = $(selector);
        if (found.length > 0) {
          eventElements = found;
          console.log(`    Found ${found.length} events with fallback selector: ${selector}`);
          break;
        }
      }
    }

    eventElements.each((_, el) => {
      const $el = $(el);
      
      // Get title from Wix data-hook attribute
      const title = cleanText(
        $el.find('[data-hook="ev-list-item-title"]').text() ||
        $el.find('.noWi58').text() ||
        $el.find('[class*="title"]').first().text()
      );
      
      if (!title || title.length < 3 || title.length > 300) return;
      
      // Get description from Wix data-hook attribute
      const description = cleanText(
        $el.find('[data-hook="ev-list-item-description"]').text() ||
        $el.find('.aHRnBg').text()
      );
      
      // Get full date/time from Wix data-hook (format: "Feb 12, 2026, 5:30 PM – 7:30 PM")
      const dateTimeText = cleanText(
        $el.find('[data-hook="date"]').text() ||
        $el.find('.Ke8eTf').text()
      );
      
      // Also get short date display (format: "Thu, Feb 12")
      const shortDateText = cleanText(
        $el.find('[data-hook="ev-date"]').text() ||
        $el.find('.nDmqzY').text()
      );
      
      // Parse date from full datetime text (e.g., "Feb 12, 2026, 5:30 PM – 7:30 PM")
      const fullDateMatch = dateTimeText.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
      const timeMatch = dateTimeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
      
      if (!fullDateMatch) return;
      
      const month = MONTHS[fullDateMatch[1].toLowerCase()];
      if (!month) return;
      
      const day = fullDateMatch[2].padStart(2, '0');
      const year = fullDateMatch[3];
      const date = `${year}-${month}-${day}`;
      
      const time = timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3]}`) : 'TBD';
      
      // Get link from RSVP button
      let link = $el.find('[data-hook="ev-rsvp-button"]').attr('href') || 
                 $el.find('a[href*="event"]').first().attr('href') ||
                 '';
      
      if (link && !link.startsWith('http')) {
        link = `https://www.grjuniorchamber.com${link.startsWith('/') ? '' : '/'}${link}`;
      }
      
      // Determine if event is free - check button text
      const buttonText = cleanText($el.find('[data-hook="ev-rsvp-button"]').text());
      const isFree = !buttonText.toLowerCase().includes('buy') && 
                     !buttonText.toLowerCase().includes('ticket') &&
                     !buttonText.toLowerCase().includes('register');
      
      const category = categorizeEvent(title, description);
      const effectiveDescription = description || 'Leadership development and networking event hosted by the Grand Rapids Junior Chamber';
      
      events.push({
        id: generateEventId(SOURCE, title, date),
        title,
        description: effectiveDescription,
        date,
        time,
        startDateTime: toISODateTime(date, time),
        location: {
          name: 'Grand Rapids Junior Chamber',
          address: '250 Monroe Ave NW Ste 150',
          city: 'Grand Rapids',
          state: 'MI',
          zip: '49503',
        },
        url: link || config.url,
        source: SOURCE,
        category,
        isRecurring: detectRecurringEvent(title, effectiveDescription, dateTimeText),
        isFree,
        scrapedAt,
      });
    });

    // Deduplicate by title + date
    const uniqueEvents = Array.from(
      new Map(events.map(e => [`${e.title}-${e.date}`, e])).values()
    );

    return createScrapeResult(SOURCE, uniqueEvents);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

async function scrapeRightPlace() {
  const SOURCE = 'right-place';
  const config = SOURCE_CONFIG[SOURCE];
  
  function categorizeEvent(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('network') || text.includes('mixer') || text.includes('coffee') || text.includes('exchange')) return 'networking';
    if (text.includes('workshop') || text.includes('training') || text.includes('candid conversation')) return 'workshop';
    if (text.includes('conference') || text.includes('summit') || text.includes('forum') || text.includes('outlook')) return 'conference';
    if (text.includes('meetup') || text.includes('connect')) return 'meetup';
    if (text.includes('pitch') || text.includes('startup') || text.includes('entrepreneur')) return 'pitch';
    if (text.includes('developer') || text.includes('tech') || text.includes('go beyond')) return 'workshop';
    return 'other';
  }
  
  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const scrapedAt = new Date().toISOString();
    const seenLinks = new Set();

    // Primary approach: Find all links to event detail pages
    $('a[href*="/events/"]').each((_, el) => {
      const $link = $(el);
      const href = $link.attr('href') || '';
      
      // Skip if not an event detail link or already processed
      if (!href || href === '/events' || href === '/events/' || href.endsWith('/events')) return;
      if (seenLinks.has(href)) return;
      
      // Skip pagination links
      if (/\/events\/p\d+/.test(href)) return;
      
      // Build full URL
      let fullUrl = href;
      if (!href.startsWith('http')) {
        fullUrl = `https://www.rightplace.org${href.startsWith('/') ? '' : '/'}${href}`;
      }
      
      // Get the container element - look for parent with event info
      let $container = $link.closest('div, article, section, li').first();
      
      // If container is too small, try parent
      if ($container.text().length < 50) {
        $container = $container.parent().closest('div, article, section').first();
      }
      
      const containerText = $container.text();
      
      // Get title - prefer h3 inside or near the link
      let title = cleanText(
        $link.find('h3').text() ||
        $container.find('h3').first().text() ||
        $link.text()
      );
      
      // Clean up title
      if (!title || title.length < 5) return;
      if (title.length > 200) title = title.substring(0, 200);
      
      // Skip navigation/filter items
      if (['Events', 'News', 'Contact', 'About Us', 'Home', 'Upcoming Events', 'Past Events', 'Filter'].includes(title)) return;
      if (title.startsWith('View ') || title.includes('Sponsorship')) return;
      
      // Extract date - format: "February 12, 2026" or "March 3, 2026"
      const dateMatch = containerText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:–\d{1,2})?,?\s+(\d{4})/i);
      if (!dateMatch) return;
      
      const month = MONTHS[dateMatch[1].toLowerCase()];
      if (!month) return;
      
      const day = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      const date = `${year}-${month}-${day}`;
      
      // Skip past events
      if (containerText.toLowerCase().includes('past event')) return;
      
      // Extract time - format: "7:30AM–10:00AM" or "8:00AM"
      const timeMatch = containerText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      const time = timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3]}`) : 'TBD';
      
      // Extract description
      let description = '';
      const $desc = $container.find('p').first();
      if ($desc.length > 0) {
        description = cleanText($desc.text());
      }
      
      // Extract location from known venue patterns
      let locationText = '';
      const locationPatterns = [
        /(Frederik Meijer Gardens)/i,
        /(Amway Grand Plaza)/i,
        /(JW Marriott Grand Rapids)/i,
        /(Bamboo Grand Rapids)/i,
        /(DeVos Place)/i,
        /(GVSU)/i,
      ];
      
      for (const pattern of locationPatterns) {
        const locMatch = containerText.match(pattern);
        if (locMatch) {
          locationText = cleanText(locMatch[1]);
          break;
        }
      }
      
      // Check for TBD location
      if (!locationText && containerText.includes('TBD')) {
        locationText = 'TBD';
      }
      
      seenLinks.add(href);
      
      const category = categorizeEvent(title, description);
      const effectiveDescription = description || 'Business and economic development event hosted by The Right Place.';
      
      events.push({
        id: generateEventId(SOURCE, title, date),
        title,
        description: effectiveDescription,
        date,
        time,
        startDateTime: toISODateTime(date, time),
        location: {
          name: locationText || 'The Right Place',
          address: '25 Ottawa Ave SW, Suite 400',
          city: 'Grand Rapids',
          state: 'MI',
          zip: '49503',
        },
        url: fullUrl,
        source: SOURCE,
        category,
        isRecurring: detectRecurringEvent(title, effectiveDescription, containerText),
        isFree: detectFreeEvent(title, effectiveDescription, containerText),
        scrapedAt,
      });
    });

    // Deduplicate by title + date
    const uniqueEvents = Array.from(
      new Map(events.map(e => [`${e.title}-${e.date}`, e])).values()
    );
    
    console.log(`    Found ${uniqueEvents.length} events from The Right Place`);

    return createScrapeResult(SOURCE, uniqueEvents);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

// =============================================================================
// Geocoding
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
  'start garden': { lat: 42.9659, lng: -85.6716 },
  'bamboo grand rapids': { lat: 42.9614, lng: -85.6726 },
  'the bridge incubator': { lat: 42.9636, lng: -85.6617 },
  'grand rapids downtown market': { lat: 42.9679, lng: -85.6731 },
  'devos place': { lat: 42.9692, lng: -85.6772 },
  'jw marriott grand rapids': { lat: 42.9679, lng: -85.6766 },
  'msu foundation': { lat: 42.7323, lng: -84.5555 },
  'bamboo ann arbor': { lat: 42.2776, lng: -83.7409 },
  'bamboo royal oak': { lat: 42.4895, lng: -83.1446 },
  'gr junior chamber': { lat: 42.9634, lng: -85.6681 },
  'grand rapids junior chamber': { lat: 42.9634, lng: -85.6681 },
  'the right place': { lat: 42.9634, lng: -85.6732 },
  'right place': { lat: 42.9634, lng: -85.6732 },
  'frederik meijer gardens': { lat: 42.9797, lng: -85.5889 },
  'amway grand plaza': { lat: 42.9689, lng: -85.6772 },
  'junior achievement': { lat: 42.9556, lng: -85.6544 },
  'gvsu': { lat: 42.9631, lng: -85.8886 },
  'gvsu allendale': { lat: 42.9631, lng: -85.8886 },
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
        'User-Agent': 'GREventsCalendar/1.0',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      geocodeCache[cacheKey] = null;
      await saveGeoCache();
      return null;
    }
    
    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
    
    geocodeCache[cacheKey] = result;
    await saveGeoCache();
    
    return result;
  } catch (error) {
    console.error(`Geocoding error for "${query}":`, error.message);
    return null;
  }
}

async function geocodeEvent(event) {
  if (event.location.lat && event.location.lng) {
    return event;
  }
  
  // Check known venues first
  const knownCoords = getKnownVenueCoords(event.location.name);
  if (knownCoords) {
    return {
      ...event,
      location: {
        ...event.location,
        ...knownCoords,
      },
    };
  }
  
  // Fall back to Nominatim API
  const result = await geocodeAddress(
    event.location.address,
    event.location.city,
    event.location.state
  );
  
  if (result) {
    return {
      ...event,
      location: {
        ...event.location,
        lat: result.lat,
        lng: result.lng,
      },
    };
  }
  
  // Try with just city if full address fails
  const cityResult = await geocodeAddress('', event.location.city, event.location.state);
  if (cityResult) {
    return {
      ...event,
      location: {
        ...event.location,
        lat: cityResult.lat,
        lng: cityResult.lng,
      },
    };
  }
  
  return event;
}

async function geocodeEvents(events, onProgress) {
  const geocodedEvents = [];
  let apiCalls = 0;
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    const needsApiCall = !event.location.lat && 
                         !event.location.lng && 
                         !getKnownVenueCoords(event.location.name);
    
    const geocodedEvent = await geocodeEvent(event);
    geocodedEvents.push(geocodedEvent);
    
    if (onProgress) {
      onProgress(i + 1, events.length);
    }
    
    // Rate limit API calls
    if (needsApiCall && i < events.length - 1) {
      apiCalls++;
      await delay(1500);
    }
  }
  
  console.log(`  Geocoding complete: ${apiCalls} API calls made`);
  return geocodedEvents;
}

// =============================================================================
// Main Scrape Function
// =============================================================================

async function runFullScrape() {
  const scrapers = [
    { name: 'MSU Foundation', fn: scrapeMsuFoundation },
    { name: 'Start Garden', fn: scrapeStartGarden },
    { name: 'Bamboo', fn: scrapeBamboo },
    { name: 'Grand Rapids Org', fn: scrapeGrandRapidsOrg },
    { name: 'GR Junior Chamber', fn: scrapeGrJuniorChamber },
    { name: 'The Right Place', fn: scrapeRightPlace },
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
    
    // Set up source info
    const sourceConfig = SOURCE_CONFIG[result.source];
    sources[result.source] = {
      ...sourceConfig,
      eventCount: result.events.length,
      lastScraped: result.scrapedAt,
    };
    
    // Rate limiting between scrapers
    await delay(1000);
  }
  
  // Remove duplicates
  const uniqueEvents = Array.from(
    new Map(allEvents.map(event => [event.id, event])).values()
  );
  
  // Sort by date
  uniqueEvents.sort((a, b) => {
    const dateA = new Date(a.startDateTime);
    const dateB = new Date(b.startDateTime);
    return dateA.getTime() - dateB.getTime();
  });
  
  return {
    events: uniqueEvents,
    sources,
    results,
  };
}

// =============================================================================
// Main Entry Point
// =============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   GR Events Calendar - Scraper        ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  
  // Check for --force flag to bypass the 24-hour limit
  const forceRun = process.argv.includes('--force');
  
  // Check if we've scraped within the last 24 hours
  if (!forceRun) {
    try {
      const existingData = await fs.readFile(DATA_FILE, 'utf-8');
      const { lastScraped } = JSON.parse(existingData);
      
      if (lastScraped) {
        const lastScrapedDate = new Date(lastScraped);
        const now = new Date();
        const hoursSinceLastScrape = (now - lastScrapedDate) / (1000 * 60 * 60);
        
        if (hoursSinceLastScrape < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastScrape);
          console.log(`⏳ Last scrape was ${Math.floor(hoursSinceLastScrape)} hours ago.`);
          console.log(`   Scraping is limited to once per day to avoid excessive requests.`);
          console.log(`   Next scrape allowed in ~${hoursRemaining} hour(s).`);
          console.log('');
          console.log('   Use --force flag to override: node scripts/scrape-events.js --force');
          process.exit(0);
        }
      }
    } catch {
      // No existing data file or invalid JSON, proceed with scrape
    }
  } else {
    console.log('⚠️  Force flag detected - bypassing 24-hour limit');
    console.log('');
  }
  
  try {
    // Run scrapers
    console.log('Starting scrape...');
    console.log('');
    
    const { events, sources, results } = await runFullScrape();
    
    console.log('');
    console.log(`Total: ${events.length} unique events from ${Object.keys(sources).length} sources`);
    console.log('');
    
    // Geocode events
    console.log('Geocoding events...');
    const geocodedEvents = await geocodeEvents(events, (completed, total) => {
      if (completed % 10 === 0 || completed === total) {
        process.stdout.write(`  Progress: ${completed}/${total}\r`);
      }
    });
    console.log('');
    
    // Prepare final data
    const data = {
      events: geocodedEvents,
      lastScraped: new Date().toISOString(),
      sources,
    };
    
    // Save to file
    console.log('Saving to src/data/events.json...');
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

// Run if called directly
main();
