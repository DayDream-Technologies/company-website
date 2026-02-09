/**
 * GR Events Calendar - Types and Constants
 */

// Source configuration
const SOURCE_CONFIG = {
  'msu-foundation': {
    id: 'msu-foundation',
    name: 'MSU Foundation',
    url: 'https://msufoundation.org/events/',
    color: '#18453B', // MSU Green
  },
  'start-garden': {
    id: 'start-garden',
    name: 'Start Garden',
    url: 'https://startgarden.com/events/',
    color: '#FF6B35', // Orange
  },
  'bamboo': {
    id: 'bamboo',
    name: 'Bamboo Cowork',
    url: 'https://www.bamboocowork.com/events-at-bamboo',
    color: '#4CAF50', // Green
  },
  'grand-rapids-org': {
    id: 'grand-rapids-org',
    name: 'GR Chamber of Commerce',
    url: 'https://grandrapids.org/events/',
    color: '#2196F3', // Blue
  },
  'gr-junior-chamber': {
    id: 'gr-junior-chamber',
    name: 'GR Junior Chamber',
    url: 'https://www.grjuniorchamber.com/',
    color: '#9C27B0', // Purple
  },
  'right-place': {
    id: 'right-place',
    name: 'The Right Place',
    url: 'https://www.rightplace.org/events/',
    color: '#1E3A5F', // Dark blue
  },
  'startup-garage': {
    id: 'startup-garage',
    name: 'Startup Garage',
    url: 'https://www.startupgarage.org/events',
    color: '#E65100', // Orange
  },
};

// Grand Rapids area coordinates (for map centering)
const GRAND_RAPIDS_CENTER = {
  lat: 42.9634,
  lng: -85.6681,
};

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
window.GREvents.VIEW_TYPES = VIEW_TYPES;
window.GREvents.SORT_OPTIONS = SORT_OPTIONS;
window.GREvents.EVENT_CATEGORIES = EVENT_CATEGORIES;
window.GREvents.getSourceConfig = getSourceConfig;
window.GREvents.getAllSourceIds = getAllSourceIds;
