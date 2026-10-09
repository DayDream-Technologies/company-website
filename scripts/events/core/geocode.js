/**
 * Geocoding with the shared Nominatim cache.
 * Caps live lookups per run; leftover events fall back to the zone city center.
 */

const fs = require('fs').promises;
const path = require('path');
const { delay } = require('./fetch');
const { getZone } = require('./zones');

const CACHE_FILE = path.join(__dirname, '..', '..', '..', 'src', 'data', 'geocache.json');

const KNOWN_VENUES = {
  'start garden': { lat: 42.9659, lng: -85.6716 },
  'bamboo grand rapids': { lat: 42.9614, lng: -85.6726 },
  'the bridge incubator': { lat: 42.9636, lng: -85.6617 },
  'grand rapids downtown market': { lat: 42.9679, lng: -85.6731 },
  'devos place': { lat: 42.9692, lng: -85.6772 },
  'jw marriott grand rapids': { lat: 42.9679, lng: -85.6766 },
  'msu research foundation': { lat: 42.7323, lng: -84.5555 },
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
  'calvin university': { lat: 42.9242, lng: -85.5875 },
  'cornerstone university': { lat: 42.9875, lng: -85.5872 },
  'west coast chamber': { lat: 42.7875, lng: -86.1089 },
  'techtown': { lat: 42.355, lng: -83.061 },
  'ann arbor spark': { lat: 42.2808, lng: -83.743 },
};

let geocodeCache = null;
let apiCalls = 0;

function getKnownVenueCoords(venueName) {
  const normalized = String(venueName || '').toLowerCase().trim();
  if (!normalized) return null;
  for (const [name, coords] of Object.entries(KNOWN_VENUES)) {
    if (normalized.includes(name) || name.includes(normalized)) return coords;
  }
  return null;
}

async function loadGeoCache() {
  if (geocodeCache) return geocodeCache;
  try {
    geocodeCache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf-8'));
  } catch {
    geocodeCache = {};
  }
  return geocodeCache;
}

async function saveGeoCache() {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(CACHE_FILE, JSON.stringify(geocodeCache, null, 2));
  } catch (error) {
    console.error('Failed to save geocode cache:', error.message);
  }
}

async function geocodeAddress(address, city, state = 'MI') {
  await loadGeoCache();
  const cacheKey = `${address}|${city}|${state}`.toLowerCase().trim();
  if (cacheKey in geocodeCache) return geocodeCache[cacheKey];
  if (apiCalls >= geocodeAddress.maxCalls) return null;

  const query = [address, city, state, 'USA'].filter(Boolean).join(', ');
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MichiganSmartZoneEvents/1.0 (daydreamtechnologies.net)',
        Accept: 'application/json',
      },
    });
    apiCalls += 1;
    await delay(1500);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.length) {
      geocodeCache[cacheKey] = null;
      return null;
    }
    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    geocodeCache[cacheKey] = result;
    return result;
  } catch (error) {
    console.error(`Geocoding error for "${query}":`, error.message);
    return null;
  }
}

geocodeAddress.maxCalls = 300;

function withZoneCenter(event) {
  const zone = getZone(event.zone);
  if (!zone) return event;
  return {
    ...event,
    location: { ...event.location, lat: zone.center.lat, lng: zone.center.lng },
  };
}

async function geocodeEvents(events, { maxCalls = 300 } = {}) {
  apiCalls = 0;
  geocodeAddress.maxCalls = maxCalls;
  await loadGeoCache();
  const out = [];

  for (const event of events) {
    if (event.location?.lat && event.location?.lng) {
      out.push(event);
      continue;
    }
    const known = getKnownVenueCoords(event.location?.name);
    if (known) {
      out.push({ ...event, location: { ...event.location, ...known } });
      continue;
    }
    if (apiCalls >= maxCalls) {
      out.push(withZoneCenter(event));
      continue;
    }
    const result = await geocodeAddress(event.location?.address, event.location?.city, event.location?.state || 'MI');
    if (result) {
      out.push({ ...event, location: { ...event.location, ...result } });
      continue;
    }
    if (apiCalls < maxCalls && event.location?.city) {
      const cityResult = await geocodeAddress('', event.location.city, event.location?.state || 'MI');
      if (cityResult) {
        out.push({ ...event, location: { ...event.location, ...cityResult } });
        continue;
      }
    }
    out.push(withZoneCenter(event));
  }

  await saveGeoCache();
  console.log(`Geocoding complete: ${apiCalls} Nominatim calls (cap ${maxCalls})`);
  return out;
}

module.exports = {
  CACHE_FILE,
  getKnownVenueCoords,
  geocodeEvents,
  loadGeoCache,
};
