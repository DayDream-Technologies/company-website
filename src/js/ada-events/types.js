/**
 * Ada Events Calendar - Types and Constants
 *
 * Mirrors src/js/gr-events/types.js but scoped to Ada-area sources and the
 * Ada Township map center. Writes to the same `window.GREvents` namespace as
 * the GR page so the shared lib/ and components/ modules can run unchanged.
 */

const SOURCE_CONFIG = {
  'ada-business-association': {
    id: 'ada-business-association',
    name: 'Ada Business Association',
    url: 'https://adabusinessassociation.com/events/',
    color: '#1976D2',
  },
  'ada-township-community': {
    id: 'ada-township-community',
    name: 'Ada Township Community',
    url: 'https://www.adamichigan.org/community/events.php',
    color: '#0D47A1',
  },
  'ada-township-parks': {
    id: 'ada-township-parks',
    name: 'Ada Township Parks & Rec',
    url: 'https://www.adamichigan.org/departments/parks_recreation_land_preservation/community___special_events.php',
    color: '#2E7D32',
  },
  'ada-farmers-market': {
    id: 'ada-farmers-market',
    name: 'Ada Farmers Market',
    url: 'https://www.adamichigan.org/community/farmers_market/index.php',
    color: '#F57C00',
  },
  'amy-van-andel-library': {
    id: 'amy-van-andel-library',
    name: 'Amy Van Andel Library',
    url: 'https://www.kdl.org/branches/amy-van-andel',
    color: '#6A1B9A',
  },
  'discover-ada': {
    id: 'discover-ada',
    name: 'Discover Ada',
    url: 'https://www.adavillage.com/',
    color: '#C2185B',
  },
};

// Map center for the Ada Events page. The constant keeps its legacy name
// (GRAND_RAPIDS_CENTER) so shared components like map-view.js keep working
// without modification, but the coordinates point to Ada Village.
const GRAND_RAPIDS_CENTER = {
  lat: 42.9606,
  lng: -85.4936,
};

const VIEW_TYPES = {
  LIST: 'list',
  CALENDAR: 'calendar',
  MAP: 'map',
};

const SORT_OPTIONS = {
  DATE_ASC: 'date-asc',
  DATE_DESC: 'date-desc',
  TITLE: 'title',
};

const EVENT_CATEGORIES = [
  'networking',
  'workshop',
  'conference',
  'meetup',
  'pitch',
  'accelerator',
  'market',
  'concert',
  'parade',
  'festival',
  'library',
  'happy-hour',
  'other',
];

function getSourceConfig(sourceId) {
  return SOURCE_CONFIG[sourceId] || null;
}

function getAllSourceIds() {
  return Object.keys(SOURCE_CONFIG);
}

window.GREvents = window.GREvents || {};
window.GREvents.SOURCE_CONFIG = SOURCE_CONFIG;
window.GREvents.GRAND_RAPIDS_CENTER = GRAND_RAPIDS_CENTER;
window.GREvents.VIEW_TYPES = VIEW_TYPES;
window.GREvents.SORT_OPTIONS = SORT_OPTIONS;
window.GREvents.EVENT_CATEGORIES = EVENT_CATEGORIES;
window.GREvents.getSourceConfig = getSourceConfig;
window.GREvents.getAllSourceIds = getAllSourceIds;
