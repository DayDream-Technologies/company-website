/**
 * GrowthZone / ChamberMaster public event detail page parser.
 * Shared by GR events (South Kent, West Coast) and Ada events scrapers.
 */

const MONTHS = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

function cleanText(text) {
  if (!text) return '';
  return String(text).replace(/\s+/g, ' ').trim();
}

/**
 * @param {import('cheerio').CheerioAPI} $ - cheerio root
 * @param {string} pageUrl
 * @param {object} ctx
 * @param {string} ctx.sourceId
 * @param {string} ctx.scrapedAt - ISO string
 * @param {function} ctx.parseTime
 * @param {function} ctx.toISODateTime
 * @param {function} ctx.generateEventId
 * @param {function} ctx.detectRecurringEvent
 * @param {function} ctx.detectFreeEvent
 * @param {function} ctx.categorizeEvent - (title, description) => string
 * @param {string} ctx.defaultDescription
 * @param {{ name: string, address: string, city: string, state: string }} ctx.defaultLocation
 */
function parseChamberMasterEventDetail($, pageUrl, ctx) {
  const {
    sourceId,
    scrapedAt,
    parseTime,
    toISODateTime,
    generateEventId,
    detectRecurringEvent,
    detectFreeEvent,
    categorizeEvent,
    defaultDescription,
    defaultLocation,
  } = ctx;

  const title =
    cleanText($('h1').not(':contains("EVENTS")').first().text()) ||
    cleanText($('h1').last().text()) ||
    '';
  if (!title || title.length < 3) return null;

  const bodyText = cleanText($('main, #primary, .entry-content, body').first().text());

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
    dateBlock = bodyText;
  }

  const dateMatch = dateBlock.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (!dateMatch) return null;
  const month = MONTHS[dateMatch[1].toLowerCase()];
  if (!month) return null;
  const day = dateMatch[2].padStart(2, '0');
  const date = `${dateMatch[3]}-${month}-${day}`;

  const endDateMatch = dateBlock
    .slice(dateMatch.index + dateMatch[0].length)
    .match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  let endDate = null;
  if (endDateMatch) {
    const em = MONTHS[endDateMatch[1].toLowerCase()];
    if (em) endDate = `${endDateMatch[3]}-${em}-${endDateMatch[2].padStart(2, '0')}`;
  }

  const timeMatch = dateBlock.match(
    /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i
  );
  const singleTimeMatch = dateBlock.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  let time = 'TBD';
  let endTime = null;
  if (timeMatch) {
    time = parseTime(timeMatch[1]);
    endTime = parseTime(timeMatch[2]);
  } else if (singleTimeMatch) {
    time = parseTime(singleTimeMatch[1]);
  }

  let locationName = defaultLocation.name;
  let address = defaultLocation.address || '';
  let city = defaultLocation.city;
  const state = defaultLocation.state || 'MI';
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

  let description = '';
  $('p').each((_, p) => {
    if (description) return;
    const t = cleanText($(p).text());
    if (t.length > 40 && t.length < 700) description = t;
  });

  const feesText = (feesBlock || '').toLowerCase();
  const isFree =
    /no\s+admission|free/.test(feesText) || detectFreeEvent(title, description, feesText);

  const event = {
    id: generateEventId(sourceId, title, date),
    title,
    description: description || defaultDescription,
    date,
    time,
    startDateTime: toISODateTime(date, time),
    location: { name: locationName, address, city, state },
    url: pageUrl,
    source: sourceId,
    category: categorizeEvent(title, description),
    isRecurring: detectRecurringEvent(title, description, bodyText),
    isFree,
    scrapedAt,
  };
  if (endTime) event.endDateTime = toISODateTime(date, endTime);
  if (endDate && endDate !== date) event.endDate = endDate;
  return event;
}

/**
 * GrowthZone event-calendar detail pages (e.g. business.westcoastchamber.org/event-calendar/Details/...).
 * Layout differs from ChamberMaster /events/details/ pages.
 */
function parseGrowthZoneEventCalendarDetail($, pageUrl, ctx) {
  if ($('.gz-event-details').length === 0) return null;

  const {
    sourceId,
    scrapedAt,
    parseTime,
    toISODateTime,
    generateEventId,
    detectRecurringEvent,
    detectFreeEvent,
    categorizeEvent,
    defaultDescription,
    defaultLocation,
  } = ctx;

  const title =
    cleanText($('.gz-event-details-header h1').first().text()) ||
    cleanText($('h1').not(':contains("EVENTS")').first().text()) ||
    '';
  if (!title || title.length < 3) return null;
  if (/^cancelled:/i.test(title)) return null;

  const dateTimeText =
    cleanText($('.gz-event-time').first().text()) ||
    cleanText($('.gz-event-details-header').text()) ||
    '';

  const dateMatch = dateTimeText.match(/([A-Za-z]+),\s+([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (!dateMatch) return null;
  const month = MONTHS[dateMatch[2].toLowerCase()];
  if (!month) return null;
  const day = dateMatch[3].padStart(2, '0');
  const date = `${dateMatch[4]}-${month}-${day}`;

  const timeMatch = dateTimeText.match(
    /\((\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i
  );
  const singleTimeMatch = dateTimeText.match(/\((\d{1,2}:\d{2}\s*(?:AM|PM))/i);
  let time = 'TBD';
  let endTime = null;
  if (timeMatch) {
    time = parseTime(timeMatch[1]);
    endTime = parseTime(timeMatch[2]);
  } else if (singleTimeMatch) {
    time = parseTime(singleTimeMatch[1]);
  }

  let locationName = defaultLocation.name;
  let address = defaultLocation.address || '';
  let city = defaultLocation.city;
  const state = defaultLocation.state || 'MI';

  const addressBlock = cleanText($('.gz-event-address').text());
  if (addressBlock) {
    const cityStateMatch = addressBlock.match(/\b([A-Za-z][A-Za-z\s]+?),\s*MI(?:\s+(\d{5}))?/);
    if (cityStateMatch) {
      city = cityStateMatch[1].trim();
      const beforeCity = addressBlock.slice(0, cityStateMatch.index).trim();
      const streetMatch = beforeCity.match(/^(.+?)\s+(\d+\s+.+)$/);
      if (streetMatch) {
        locationName = streetMatch[1].trim();
        address = streetMatch[2].trim();
        if (cityStateMatch[2]) {
          address = `${address}, ${city}, MI ${cityStateMatch[2]}`;
        }
      } else {
        locationName = beforeCity || addressBlock;
      }
    } else {
      locationName = addressBlock;
    }
  }

  let description = cleanText($('.gz-event-description').text());
  if (description.toLowerCase().startsWith('description')) {
    description = description.slice('description'.length).trim();
  }
  if (description.length > 600) {
    description = description.slice(0, 597) + '...';
  }

  const pricingText = cleanText($('.gz-event-pricing-info, .gz-event-pricing').text()).toLowerCase();
  const bodyText = cleanText($('.gz-event-details').text());
  const isFree =
    /free to attend|no admission|free\b/.test(pricingText) ||
    detectFreeEvent(title, description, pricingText);

  const event = {
    id: generateEventId(sourceId, title, date),
    title,
    description: description || defaultDescription,
    date,
    time,
    startDateTime: toISODateTime(date, time),
    location: { name: locationName, address, city, state },
    url: pageUrl,
    source: sourceId,
    category: categorizeEvent(title, description),
    isRecurring: detectRecurringEvent(title, description, bodyText),
    isFree,
    scrapedAt,
  };
  if (endTime) event.endDateTime = toISODateTime(date, endTime);
  return event;
}

module.exports = {
  parseChamberMasterEventDetail,
  parseGrowthZoneEventCalendarDetail,
  MONTHS,
};
