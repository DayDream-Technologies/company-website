/**
 * GR Summer Music - Types and Constants
 *
 * Mirrors src/js/gr-events/types.js but scoped to West Michigan summer music
 * sources. Writes to the same `window.GREvents` namespace as the GR page so
 * the shared lib/ and components/ modules can run unchanged.
 */

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

// Grand Rapids area coordinates (for map centering)
const GRAND_RAPIDS_CENTER = {
  lat: 42.9634,
  lng: -85.6681,
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
  'concert',
  'jazz',
  'faith based',
  'outdoor',
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
