/**
 * Michigan SmartZone events - shared types.
 * SOURCE_CONFIG is filled from the region JSON at runtime.
 */

const SOURCE_CONFIG = {};
const MAP_VIEW = { lat: 42.9634, lng: -85.6681, zoom: 11 };
const GRAND_RAPIDS_CENTER = MAP_VIEW;
const REGION_ZONES = [];

// View types
const VIEW_TYPES = {
  LIST: 'list',
  CALENDAR: 'calendar',
  MAP: 'map',
};

// Sort options
const SORT_OPTIONS = {
  DATE_ASC: 'date-asc',
  DATE_DESC: 'date-desc',
  TITLE: 'title',
};

// Event categories
const EVENT_CATEGORIES = [
  'networking',
  'workshop',
  'conference',
  'meetup',
  'pitch',
  'accelerator',
  'other',
];

// Get source config by ID
function getSourceConfig(sourceId) {
  return SOURCE_CONFIG[sourceId] || null;
}

// Get all source IDs
function getAllSourceIds() {
  return Object.keys(SOURCE_CONFIG);
}

// Export for use in other modules
window.GREvents = window.GREvents || {};
window.GREvents.SOURCE_CONFIG = SOURCE_CONFIG;
window.GREvents.GRAND_RAPIDS_CENTER = GRAND_RAPIDS_CENTER;
window.GREvents.MAP_VIEW = MAP_VIEW;
window.GREvents.REGION_ZONES = REGION_ZONES;

function applyRegionData(data) {
  Object.keys(SOURCE_CONFIG).forEach((key) => delete SOURCE_CONFIG[key]);
  Object.entries(data.sources || {}).forEach(([id, source]) => {
    SOURCE_CONFIG[id] = {
      id,
      name: source.name,
      url: source.url,
      color: source.color || '#10b981',
    };
  });
  if (data.region?.center) {
    MAP_VIEW.lat = data.region.center.lat;
    MAP_VIEW.lng = data.region.center.lng;
    MAP_VIEW.zoom = data.region.zoom || 8;
  }
  REGION_ZONES.splice(0, REGION_ZONES.length, ...(data.region?.zones || []));
}

window.GREvents.applyRegionData = applyRegionData;
window.GREvents.VIEW_TYPES = VIEW_TYPES;
window.GREvents.SORT_OPTIONS = SORT_OPTIONS;
window.GREvents.EVENT_CATEGORIES = EVENT_CATEGORIES;
window.GREvents.getSourceConfig = getSourceConfig;
window.GREvents.getAllSourceIds = getAllSourceIds;
