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
  
  function parseLocation(locationText) {
    const locations = {
      'ann arbor': { name: 'Bamboo Ann Arbor', city: 'Ann Arbor' },
      'downtown detroit': { name: 'Bamboo Downtown Detroit', city: 'Detroit' },
      'midtown detroit': { name: 'Bamboo Midtown Detroit', city: 'Detroit' },
      'grand rapids': { name: 'Bamboo Grand Rapids', city: 'Grand Rapids' },
      'royal oak': { name: 'Bamboo Royal Oak', city: 'Royal Oak' },
    };

    const lower = (locationText || '').toLowerCase();
    for (const [key, loc] of Object.entries(locations)) {
      if (lower.includes(key)) return loc;
    }
    return { name: 'Bamboo Cowork', city: 'Grand Rapids' };
  }
  
  try {
    const html = await fetchHtml(config.url);
    const $ = loadHtml(html);
    const events = [];
    const scrapedAt = new Date().toISOString();

    const eventSelectors = [
      '.event-item', '[class*="event-card"]', '[class*="event_card"]',
      '.w-dyn-item', '[class*="collection-item"]',
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
      
      const title = cleanText($el.find('h2, h3, h4, [class*="title"], [class*="heading"]').first().text());
      if (!title || title.length < 3) return;
      
      const description = cleanText($el.find('p, [class*="description"], [class*="excerpt"]').first().text());
      
      let dateTimeText = '';
      $el.find('[class*="date"], [class*="time"], time').each((_, dateEl) => {
        dateTimeText += ' ' + $(dateEl).text();
      });
      dateTimeText = cleanText(dateTimeText);
      
      if (!dateTimeText) {
        const allText = $el.text();
        const dateMatch = allText.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}/i);
        if (dateMatch) dateTimeText = dateMatch[0];
      }
      
      const timeMatch = dateTimeText.match(/\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)/);
      const time = timeMatch ? parseTime(timeMatch[0]) : 'TBD';
      const date = parseDate(dateTimeText);
      
      const locationText = cleanText($el.find('[class*="location"], [class*="venue"]').first().text());
      const location = parseLocation(locationText);
      
      const link = $el.find('a').first().attr('href') || $el.closest('a').attr('href') || '';
      
      if (title && date) {
        events.push({
          id: generateEventId(SOURCE, title, date),
          title,
          description,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: {
            name: location.name,
            address: '38 Commerce Ave SW',
            city: location.city,
            state: 'MI',
          },
          url: link.startsWith('http') ? link : `https://www.bamboocowork.com${link}`,
          source: SOURCE,
          scrapedAt,
        });
      }
    });

    // Filter to only include Michigan events
    const miEvents = events.filter(e => {
      const city = e.location.city.toLowerCase();
      return ['grand rapids', 'ann arbor', 'detroit', 'royal oak'].includes(city);
    });

    return createScrapeResult(SOURCE, miEvents);
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
          scrapedAt,
        });
      }
    });

    return createScrapeResult(SOURCE, events);
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
