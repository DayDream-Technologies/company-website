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
  'startup-garage': {
    id: 'startup-garage',
    name: 'Startup Garage',
    url: 'https://www.startupgarage.org/events',
    color: '#E65100',
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
  
  // Elfsight widget ID for MSU Foundation events calendar
  const ELFSIGHT_WIDGET_ID = 'b3ad2fe6-b56f-4b93-a321-654a85c4427b';
  const ELFSIGHT_API_URL = `https://core.service.elfsight.com/p/boot/?page=${encodeURIComponent(config.url)}&w=${ELFSIGHT_WIDGET_ID}`;
  
  // MSU Foundation location mapping based on location ID or name
  function getLocationFromId(locationIds, locationSettings) {
    // Default location
    const defaultLocation = {
      name: 'MSU Research Foundation',
      address: '325 E. Grand River Ave., Suite 275',
      city: 'East Lansing',
      state: 'MI',
    };
    
    if (!locationIds || locationIds.length === 0) return defaultLocation;
    
    // Try to find the location in settings
    const locationId = locationIds[0];
    const locationData = locationSettings?.[locationId];
    
    if (!locationData) {
      // Try to infer from location ID name patterns
      const idLower = locationId.toLowerCase();
      if (idLower.includes('grand rapids') || idLower.includes('bridge')) {
        return {
          name: 'The Bridge - MSU Research Foundation',
          address: '109 Michigan St NW, Suite 414',
          city: 'Grand Rapids',
          state: 'MI',
        };
      }
      if (idLower.includes('detroit') || idLower.includes('newlab')) {
        return {
          name: 'Newlab - MSU Research Foundation',
          address: '2050 15th St.',
          city: 'Detroit',
          state: 'MI',
        };
      }
      if (idLower.includes('traverse')) {
        return {
          name: 'MSU Foundation - Traverse City',
          address: '',
          city: 'Traverse City',
          state: 'MI',
        };
      }
      return defaultLocation;
    }
    
    // Use location data from settings
    const venueName = (locationData.name || locationData.value || '').toLowerCase();
    
    if (venueName.includes('grand rapids') || venueName.includes('bridge')) {
      return {
        name: locationData.name || locationData.value || 'The Bridge - MSU Research Foundation',
        address: locationData.address || '109 Michigan St NW, Suite 414',
        city: 'Grand Rapids',
        state: 'MI',
      };
    }
    
    if (venueName.includes('detroit') || venueName.includes('newlab')) {
      return {
        name: locationData.name || locationData.value || 'Newlab - MSU Research Foundation',
        address: locationData.address || '2050 15th St.',
        city: 'Detroit',
        state: 'MI',
      };
    }
    
    if (venueName.includes('traverse')) {
      return {
        name: locationData.name || locationData.value || 'MSU Foundation - Traverse City',
        address: locationData.address || '',
        city: 'Traverse City',
        state: 'MI',
      };
    }
    
    return {
      name: locationData.name || locationData.value || defaultLocation.name,
      address: locationData.address || defaultLocation.address,
      city: 'East Lansing',
      state: 'MI',
    };
  }
  
  try {
    // Fetch event data from Elfsight API
    const response = await fetch(ELFSIGHT_API_URL);
    if (!response.ok) {
      throw new Error(`Elfsight API error: ${response.status}`);
    }
    
    const apiData = await response.json();
    const widgetData = apiData?.data?.widgets?.[ELFSIGHT_WIDGET_ID]?.data;
    
    if (!widgetData || !widgetData.settings?.events) {
      console.log('    No events found in Elfsight API response');
      return createScrapeResult(SOURCE, []);
    }
    
    const eventsList = widgetData.settings.events;
    const locationSettings = widgetData.settings.locations || {};
    const events = [];
    const scrapedAt = new Date().toISOString();
    const seenEvents = new Set();
    
    // Get current date for filtering past events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const event of eventsList) {
      try {
        const title = cleanText(event.name || '');
        if (!title || title.length < 3) continue;
        
        // Parse date
        const startDate = event.start?.date;
        if (!startDate) continue;
        
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) continue;
        
        // Skip past events
        const eventDate = new Date(startDate);
        if (eventDate < today) continue;
        
        // Create unique key to avoid duplicates
        const eventKey = `${title}-${startDate}`;
        if (seenEvents.has(eventKey)) continue;
        seenEvents.add(eventKey);
        
        // Parse time
        const startTime = event.start?.time || '';
        let time = 'TBD';
        if (startTime) {
          const [hours, minutes] = startTime.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          time = `${hour12}:${minutes} ${ampm}`;
        }
        
        // Get description (clean HTML entities)
        const description = cleanText((event.description || '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'"));
        
        // Get location
        const location = getLocationFromId(event.location, locationSettings);
        
        // Get event URL
        const eventUrl = event.buttonLink?.value || config.url;
        
        // Determine if free
        const buttonText = (event.buttonText || '').toLowerCase();
        const isFree = detectFreeEvent(title, description) ||
                       title.toLowerCase().includes('office hours') ||
                       description.toLowerCase().includes('free') ||
                       buttonText.includes('register') ||
                       buttonText.includes('learn more');
        
        events.push({
          id: generateEventId(SOURCE, title, startDate),
          title,
          description,
          date: startDate,
          time,
          startDateTime: toISODateTime(startDate, time),
          location,
          url: eventUrl,
          source: SOURCE,
          category: categorizeEventByContent(title, description),
          isRecurring: event.repeatPeriod !== 'noRepeat',
          isFree,
          scrapedAt,
        });
      } catch (e) {
        // Skip invalid events
      }
    }
    
    console.log(`    Found ${events.length} events from Elfsight API`);

    return createScrapeResult(SOURCE, events);
  } catch (error) {
    return createScrapeResult(SOURCE, [], error.message);
  }
}

// Helper function to categorize events based on content
function categorizeEventByContent(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('pitch') || text.includes('startup') || text.includes('founder') || text.includes('venture')) return 'pitch';
  if (text.includes('workshop') || text.includes('training') || text.includes('session') || text.includes('101')) return 'workshop';
  if (text.includes('summit') || text.includes('conference')) return 'conference';
  if (text.includes('network') || text.includes('mixer') || text.includes('meetup') || text.includes('connection')) return 'networking';
  if (text.includes('office hours') || text.includes('mentorship') || text.includes('panel')) return 'meetup';
  return 'other';
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
  
  function parseLocationText(locationText) {
    // Parse location from fs-cmsfilter-field="location" value
    const lower = (locationText || '').toLowerCase().trim();
    
    if (lower === 'grand rapids') return { name: 'Bamboo Grand Rapids', city: 'Grand Rapids' };
    if (lower === 'ann arbor') return { name: 'Bamboo Ann Arbor', city: 'Ann Arbor' };
    if (lower === 'downtown detroit') return { name: 'Bamboo Downtown Detroit', city: 'Detroit' };
    if (lower === 'midtown detroit') return { name: 'Bamboo Midtown Detroit', city: 'Detroit' };
    if (lower === 'royal oak') return { name: 'Bamboo Royal Oak', city: 'Royal Oak' };
    
    return { name: 'Bamboo Cowork', city: lower || 'Unknown' };
  }
  
  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const scrapedAt = new Date().toISOString();
    const seenLinks = new Set();

    // Primary selector - Webflow CMS event cards
    const eventElements = $('article.cms-event');
    
    if (eventElements.length > 0) {
      console.log(`    Found ${eventElements.length} events using article.cms-event selector`);
    } else {
      console.log('    No events found with article.cms-event selector');
    }

    eventElements.each((_, el) => {
      const $el = $(el);
      
      // Get title from fs-cmsfilter-field="name"
      const title = cleanText(
        $el.find('[fs-cmsfilter-field="name"]').text() ||
        $el.find('h4.heading-xsmall').text()
      );
      
      if (!title || title.length < 3 || title.length > 200) return;
      
      // Get link from blog1_title-link
      let link = $el.find('a.blog1_title-link').attr('href') || '';
      
      // Skip duplicates
      if (link && seenLinks.has(link)) return;
      if (link) seenLinks.add(link);
      
      // Skip navigation items
      if (['Events', 'Filters', 'View details', 'Book a tour', 'Contact us'].includes(title)) return;
      
      // Get location from fs-cmsfilter-field="location"
      const locationText = cleanText($el.find('[fs-cmsfilter-field="location"]').text());
      const location = parseLocationText(locationText);
      
      // Get date/time - from .cms-event-card_info that doesn't have fs-cmsfilter-field
      // The date is in format: "Feb 5, 2026 7:30 AM"
      let dateText = '';
      $el.find('.cms-event-card_info').each((_, infoEl) => {
        const $info = $(infoEl);
        // Skip if it has fs-cmsfilter-field (that's the location)
        if (!$info.attr('fs-cmsfilter-field') && !$info.hasClass('w-condition-invisible')) {
          const text = $info.text();
          // Check if it looks like a date
          if (/[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/.test(text)) {
            dateText = text;
          }
        }
      });
      
      // Parse date
      const dateMatch = dateText.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
      if (!dateMatch) return;
      
      const month = MONTHS[dateMatch[1].toLowerCase()];
      if (!month) return;
      
      const day = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      const date = `${year}-${month}-${day}`;
      
      // Extract time from date text
      const timeMatch = dateText.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
      const time = timeMatch ? parseTime(`${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3]}`) : 'TBD';
      
      // Get description - it's in a plain div after the date info
      const fullText = $el.text();
      let description = '';
      $el.find('div').each((_, divEl) => {
        const $div = $(divEl);
        const text = $div.text().trim();
        // Skip if it's a tag, info, or button element
        if (!$div.attr('class') && 
            !$div.attr('fs-cmsfilter-field') && 
            text.length > 30 && 
            text.length < 1000 &&
            !text.includes('RSVP') &&
            !text.includes('View details')) {
          description = cleanText(text);
        }
      });
      
      // Get event type from visible .cms-event-card_tag (not w-condition-invisible)
      const eventType = cleanText(
        $el.find('.cms-event-card_tag:not(.w-condition-invisible)').first().text()
      );
      
      // Get button text for free detection
      const buttonText = cleanText($el.find('.button-tertiary').text());
      
      // Determine if free:
      // - "Members Only" = NOT free (requires membership)
      // - "Private Event" = NOT free
      // - Button says "Get Tickets" or "Buy Tickets" = NOT free
      // - "Public Event" with "RSVP" or "View" = likely free
      const isFree = !eventType.toLowerCase().includes('members only') &&
                     !eventType.toLowerCase().includes('private') &&
                     !buttonText.toLowerCase().includes('get tickets') &&
                     !buttonText.toLowerCase().includes('buy tickets');
      
      // Build full URL
      if (link && !link.startsWith('http')) {
        link = `https://www.bamboocowork.com${link.startsWith('/') ? '' : '/'}${link}`;
      }
      
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

async function scrapeStartupGarage() {
  const SOURCE = 'startup-garage';
  const config = SOURCE_CONFIG[SOURCE];
  const eventsPageUrl = config.url;
  const scrapedAt = new Date().toISOString();
  const currentYear = new Date().getFullYear();

  function parseStartupGarageDate(text) {
    // Match "Wednesday, February 11" or "Wednesday, March 4" (when page has "March 46:30pm" with no space)
    const monthNames = /(January|February|March|April|May|June|July|August|September|October|November|December)/i;
    const monthMatch = text.match(monthNames);
    if (!monthMatch) return null;
    const month = MONTHS[monthMatch[1].toLowerCase()];
    if (!month) return null;
    const afterMonth = text.slice(text.indexOf(monthMatch[1]) + monthMatch[1].length);
    // Day: two digits when followed by time with no space (e.g. "116:30pm" -> 11); one/two digits when followed by space/comma/end; single digit when followed by time (e.g. "46:30pm" -> 4)
    const twoDigitBeforeTime = afterMonth.match(/\s+(\d\d)(?=[1-9]:\d{2}\s*(?:am|pm))/i);
    const oneOrTwoDay = afterMonth.match(/\s+(\d{1,2})(?=\s|,|$)/);
    const singleDayBeforeTime = afterMonth.match(/\s+(\d)(?=\d{1,2}:\d{2}\s*(?:am|pm))/i);
    const dayStr = twoDigitBeforeTime ? twoDigitBeforeTime[1] : (oneOrTwoDay ? oneOrTwoDay[1] : (singleDayBeforeTime ? singleDayBeforeTime[1] : null));
    if (!dayStr) return null;
    const dayNum = parseInt(dayStr, 10);
    if (dayNum < 1 || dayNum > 31) return null;
    const day = dayStr.padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  function parseStartupGarageTime(text) {
    // Match "6:30pm-7:30pm" or "6:30pm" - hour 1-12 only so we don't grab "11" from date or "46" from "March 46:30"
    const rangeMatch = text.match(/([1-9]|1[0-2]):(\d{2})\s*(am|pm)\s*-\s*\d{1,2}:\d{2}\s*(?:am|pm)/i);
    if (rangeMatch) {
      return parseTime(`${rangeMatch[1]}:${rangeMatch[2]} ${rangeMatch[3]}`);
    }
    const singleMatch = text.match(/([1-9]|1[0-2]):(\d{2})\s*(am|pm)/i);
    if (singleMatch) {
      return parseTime(`${singleMatch[1]}:${singleMatch[2]} ${singleMatch[3]}`);
    }
    return 'TBD';
  }

  function getCategory(title) {
    const t = title.toUpperCase();
    if (t.includes('WORKSHOP')) return 'workshop';
    if (t.includes('PITCH')) return 'pitch';
    if (t.includes('SPEAKER')) return 'other';
    return 'other';
  }

  try {
    const html = await fetchHtml(eventsPageUrl);
    const $ = loadHtml(html);
    const events = [];

    // Event blocks: look for h4 headings (event titles), then parse only content between this h4 and the next h4
    const $headings = $('h4');
    $headings.each((i, el) => {
      const $heading = $(el);
      const title = cleanText($heading.text());
      if (!title || (title.length < 3)) return;
      if (!/speaker series|workshop/i.test(title)) return;

      const $block = $heading.nextUntil('h4');
      const blockText = ($block.length ? $block.text() : $heading.parent().text()).trim();

      const date = parseStartupGarageDate(blockText);
      if (!date) return;

      const time = parseStartupGarageTime(blockText);
      const description = cleanText($block.find('p').first().text()) || '';

      // RSVP link: first link in block that looks like eventbrite or same-site event, else main page
      let url = eventsPageUrl;
      $block.find('a[href*="eventbrite"], a[href*="event"]').each((__, link) => {
        const href = $(link).attr('href') || '';
        const text = $(link).text().toLowerCase();
        if (href && (href.includes('eventbrite') || (href.includes('startupgarage') && text.includes('rsvp')))) {
          url = href.startsWith('http') ? href : `https://www.startupgarage.org${href.startsWith('/') ? '' : '/'}${href}`;
          return false; // break
        }
      });

      // Venue: known names or address pattern "Street, Grand Rapids, MI zip"
      let locationName = '';
      let address = '';
      if (/Calvin School of Business/i.test(blockText)) {
        locationName = 'Calvin School of Business';
        address = '1810 E Beltline Ave SE';
      } else if (/Grace Christian University/i.test(blockText)) {
        locationName = 'Grace Christian University';
        address = '1011 Aldon St SW';
      } else if (/Cornerstone University/i.test(blockText)) {
        locationName = 'Cornerstone University';
        address = '1001 E Beltline Ave NE';
      }
      if (!locationName) {
        const addrMatch = blockText.match(/(\d+[\w\s\.]+(?:Ave|St|Blvd|Dr|Rd)[\w\s\.]*),?\s*Grand Rapids,?\s*MI\s*(\d{5})/i);
        if (addrMatch) {
          address = cleanText(addrMatch[1]);
          locationName = address || 'Grand Rapids';
        } else {
          locationName = 'Grand Rapids';
        }
      }

      events.push({
        id: generateEventId(SOURCE, title, date),
        title,
        description: description || `Startup Garage event: ${title}`,
        date,
        time,
        startDateTime: toISODateTime(date, time),
        location: {
          name: locationName,
          address: address || '',
          city: 'Grand Rapids',
          state: 'MI',
        },
        url,
        source: SOURCE,
        category: getCategory(title),
        isRecurring: false,
        isFree: true,
        scrapedAt,
      });
    });

    // Fallback: if no h4-based events, try parsing by sections or repeated pattern (e.g. "#### title" in markdown -> might be different selector)
    if (events.length === 0) {
      const fullText = $('body').text();
      const eventTitleMatches = fullText.matchAll(/(?:speaker series|WORKSHOP):[^\n]+/gi);
      for (const titleMatch of eventTitleMatches) {
        const title = cleanText(titleMatch[0]);
        const startIdx = titleMatch.index;
        const nextSection = fullText.indexOf('RSVP', startIdx);
        const blockText = nextSection > startIdx ? fullText.slice(startIdx, nextSection + 20) : fullText.slice(startIdx, startIdx + 800);

        const date = parseStartupGarageDate(blockText);
        if (!date) continue;

        const time = parseStartupGarageTime(blockText);
        let locationName = 'Grand Rapids';
        let address = '';
        if (/Calvin School of Business/i.test(blockText)) {
          locationName = 'Calvin School of Business';
          address = '1810 E Beltline Ave SE';
        } else if (/Grace Christian University/i.test(blockText)) {
          locationName = 'Grace Christian University';
          address = '1011 Aldon St SW';
        } else if (/Cornerstone University/i.test(blockText)) {
          locationName = 'Cornerstone University';
          address = '1001 E Beltline Ave NE';
        }

        const descMatch = blockText.match(/\n\n([A-Z][^\n]+(?:\n[^\n]+){0,3})/);
        const description = descMatch ? cleanText(descMatch[1].replace(/\n/g, ' ').substring(0, 500)) : '';

        events.push({
          id: generateEventId(SOURCE, title, date),
          title,
          description: description || `Startup Garage event: ${title}`,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: { name: locationName, address, city: 'Grand Rapids', state: 'MI' },
          url: eventsPageUrl,
          source: SOURCE,
          category: getCategory(title),
          isRecurring: false,
          isFree: true,
          scrapedAt,
        });
      }
    }

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
  'calvin school of business': { lat: 42.9242, lng: -85.5875 },
  'calvin university': { lat: 42.9242, lng: -85.5875 },
  'grace christian university': { lat: 42.9234, lng: -85.7056 },
  'cornerstone university': { lat: 42.9875, lng: -85.5872 },
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
    { name: 'Startup Garage', fn: scrapeStartupGarage },
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
