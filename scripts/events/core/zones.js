/**
 * Michigan SmartZone regions and city assignment.
 * City lists cover the host community plus nearby towns whose chambers
 * feed that zone (for example Saginaw into East Central).
 */

const REGIONS = {
  'upper-peninsula': {
    id: 'upper-peninsula',
    name: 'Upper Peninsula',
    center: { lat: 46.55, lng: -87.4 },
    zoom: 6,
    zones: ['houghton-hancock', 'marquette', 'sault-ste-marie'],
  },
  'west-michigan': {
    id: 'west-michigan',
    name: 'West Michigan',
    center: { lat: 43.0, lng: -86.0 },
    zoom: 8,
    zones: ['muskegon', 'grand-rapids', 'holland'],
  },
  'east-central': {
    id: 'east-central',
    name: 'East Central',
    center: { lat: 43.6, lng: -84.5 },
    zoom: 8,
    zones: ['midland', 'mount-pleasant'],
  },
  'east-michigan': {
    id: 'east-michigan',
    name: 'East Michigan',
    center: { lat: 43.0, lng: -82.45 },
    zoom: 9,
    zones: ['port-huron'],
  },
  'south-central': {
    id: 'south-central',
    name: 'South Central',
    center: { lat: 42.73, lng: -84.55 },
    zoom: 9,
    zones: ['lansing'],
  },
  'southwest': {
    id: 'southwest',
    name: 'Southwest',
    center: { lat: 42.29, lng: -85.4 },
    zoom: 8,
    zones: ['battle-creek', 'kalamazoo'],
  },
  'southeast': {
    id: 'southeast',
    name: 'Southeast',
    center: { lat: 42.2, lng: -83.85 },
    zoom: 8,
    zones: ['ann-arbor', 'jackson', 'adrian-tecumseh'],
  },
  'detroit-metro': {
    id: 'detroit-metro',
    name: 'Detroit Metro',
    center: { lat: 42.45, lng: -83.1 },
    zoom: 9,
    zones: ['rochester-hills', 'sterling-heights', 'troy', 'southfield', 'detroit'],
  },
  'northwest-michigan': {
    id: 'northwest-michigan',
    name: 'Northwest Michigan',
    center: { lat: 44.76, lng: -85.62 },
    zoom: 7,
    zones: ['traverse-city', 'petoskey', 'cadillac', 'manistee', 'charlevoix'],
  },
  'northeast-michigan': {
    id: 'northeast-michigan',
    name: 'Northeast Michigan',
    center: { lat: 44.95, lng: -84.1 },
    zoom: 7,
    zones: ['alpena', 'gaylord', 'cheboygan', 'grayling', 'oscoda-tawas'],
  },
};

const ZONES = {
  'houghton-hancock': {
    id: 'houghton-hancock',
    name: 'Houghton/Hancock',
    host: 'MTEC SmartZone',
    url: 'https://www.mtecsz.com/',
    region: 'upper-peninsula',
    center: { lat: 47.121, lng: -88.569 },
    cities: ['houghton', 'hancock', 'calumet', 'laurium', 'copper harbor', 'baraga', 'ontonagon', 'ironwood', 'bessemer', 'l\'anse', 'lake linden'],
  },
  marquette: {
    id: 'marquette',
    name: 'Marquette',
    host: 'Innovate Marquette',
    url: 'https://www.innovatemarquette.org/',
    region: 'upper-peninsula',
    center: { lat: 46.548, lng: -87.395 },
    cities: ['marquette', 'ishpeming', 'negaunee', 'gwinn', 'harvey', 'munising'],
  },
  'sault-ste-marie': {
    id: 'sault-ste-marie',
    name: 'Sault Ste. Marie',
    host: 'Headwaters North',
    url: 'https://www.headwatersnorth.org/',
    region: 'upper-peninsula',
    center: { lat: 46.495, lng: -84.345 },
    cities: ['sault ste. marie', 'sault ste marie', 'sault sainte marie', 'kincheloe', 'rudyard'],
  },
  muskegon: {
    id: 'muskegon',
    name: 'Muskegon',
    host: 'Muskegon Innovation Hub',
    url: 'https://www.gvsu.edu/mihub/',
    region: 'west-michigan',
    center: { lat: 43.234, lng: -86.248 },
    cities: ['muskegon', 'norton shores', 'north muskegon', 'roosevelt park', 'whitehall', 'montague', 'fruitport'],
  },
  'grand-rapids': {
    id: 'grand-rapids',
    name: 'Grand Rapids',
    host: 'Spartan Innovations / Start Garden',
    url: 'https://startgarden.com/',
    region: 'west-michigan',
    center: { lat: 42.9634, lng: -85.6681 },
    cities: [
      'grand rapids', 'wyoming', 'kentwood', 'grandville', 'walker', 'east grand rapids',
      'ada', 'rockford', 'sparta', 'lowell', 'caledonia', 'byron center', 'allendale',
      'hudsonville', 'jenison', 'comstock park', 'cascade', 'alto', 'belmont',
    ],
  },
  holland: {
    id: 'holland',
    name: 'Holland',
    host: 'Lakeshore Advantage',
    url: 'https://www.lakeshoreadvantage.com/',
    region: 'west-michigan',
    center: { lat: 42.7875, lng: -86.1089 },
    cities: ['holland', 'zeeland', 'grand haven', 'spring lake', 'ferrysburg', 'saugatuck', 'hamilton', 'douglas'],
  },
  midland: {
    id: 'midland',
    name: 'Midland',
    host: 'Midland Business Alliance',
    url: 'https://www.mbami.org/',
    region: 'east-central',
    center: { lat: 43.6156, lng: -84.2472 },
    cities: ['midland', 'sanford', 'coleman', 'auburn', 'bay city', 'essexville', 'saginaw', 'frankenmuth', 'freeland'],
  },
  'mount-pleasant': {
    id: 'mount-pleasant',
    name: 'Mount Pleasant',
    host: 'CMURC',
    url: 'https://www.cmurc.com/',
    region: 'east-central',
    center: { lat: 43.5978, lng: -84.7675 },
    cities: ['mount pleasant', 'mt. pleasant', 'mt pleasant', 'clare', 'shepherd', 'alma', 'ithaca', 'weidman'],
  },
  'port-huron': {
    id: 'port-huron',
    name: 'Port Huron',
    host: 'St. Clair County EDA',
    url: 'https://edascc.com/',
    region: 'east-michigan',
    center: { lat: 42.9709, lng: -82.4249 },
    cities: ['port huron', 'marysville', 'st. clair', 'saint clair', 'marine city', 'fort gratiot', 'yale', 'capac', 'marlette'],
  },
  lansing: {
    id: 'lansing',
    name: 'Lansing/East Lansing',
    host: 'LEAP',
    url: 'https://www.purelansing.com/',
    region: 'south-central',
    center: { lat: 42.7325, lng: -84.5555 },
    cities: [
      'lansing', 'east lansing', 'okemos', 'haslett', 'holt', 'mason', 'dewitt', 'de witt',
      'grand ledge', 'charlotte', 'st. johns', 'saint johns', 'eaton rapids', 'williamston', 'delta township',
    ],
  },
  'battle-creek': {
    id: 'battle-creek',
    name: 'Battle Creek',
    host: 'Battle Creek Unlimited',
    url: 'https://www.bcunlimited.org/',
    region: 'southwest',
    center: { lat: 42.3212, lng: -85.1797 },
    cities: ['battle creek', 'springfield', 'marshall', 'pennfield'],
  },
  kalamazoo: {
    id: 'kalamazoo',
    name: 'Kalamazoo',
    host: 'WMed Innovation Center',
    url: 'https://wmed.edu/innovationcenter',
    region: 'southwest',
    center: { lat: 42.2917, lng: -85.5872 },
    cities: ['kalamazoo', 'portage', 'oshtemo', 'parchment', 'galesburg', 'schoolcraft', 'vicksburg'],
  },
  'ann-arbor': {
    id: 'ann-arbor',
    name: 'Ann Arbor/Ypsilanti',
    host: 'Ann Arbor SPARK',
    url: 'https://annarborusa.org/',
    region: 'southeast',
    center: { lat: 42.2808, lng: -83.743 },
    cities: ['ann arbor', 'ypsilanti', 'saline', 'dexter', 'chelsea', 'milan', 'pittsfield'],
  },
  jackson: {
    id: 'jackson',
    name: 'Jackson',
    host: 'Lean Rocket Lab',
    url: 'https://www.leanrocketlab.org/',
    region: 'southeast',
    center: { lat: 42.2459, lng: -84.4013 },
    cities: ['jackson', 'brooklyn'],
  },
  'adrian-tecumseh': {
    id: 'adrian-tecumseh',
    name: 'Adrian-Tecumseh',
    host: 'Lenawee Now',
    url: 'https://www.lenaweenow.org/',
    region: 'southeast',
    center: { lat: 41.8975, lng: -84.0372 },
    cities: ['adrian', 'tecumseh', 'blissfield', 'hudson'],
  },
  'rochester-hills': {
    id: 'rochester-hills',
    name: 'Rochester Hills',
    host: 'OU INC',
    url: 'https://www.oakland.edu/ouinc/',
    region: 'detroit-metro',
    center: { lat: 42.6584, lng: -83.1499 },
    cities: ['rochester hills', 'rochester', 'auburn hills', 'oxford', 'lake orion', 'oakland township'],
  },
  'sterling-heights': {
    id: 'sterling-heights',
    name: 'Sterling Heights',
    host: 'Velocity Center',
    url: 'https://www.mivelocity.com/',
    region: 'detroit-metro',
    center: { lat: 42.5803, lng: -83.0302 },
    cities: ['sterling heights', 'utica', 'shelby township', 'clinton township', 'macomb', 'warren', 'chesterfield'],
  },
  troy: {
    id: 'troy',
    name: 'Troy',
    host: 'Automation Alley',
    url: 'https://automationalley.com/',
    region: 'detroit-metro',
    center: { lat: 42.6064, lng: -83.1498 },
    cities: ['troy', 'birmingham', 'bloomfield hills', 'bloomfield', 'clawson', 'madison heights'],
  },
  southfield: {
    id: 'southfield',
    name: 'Southfield',
    host: 'Centrepolis Accelerator',
    url: 'https://www.centrepolisaccelerator.com/',
    region: 'detroit-metro',
    center: { lat: 42.4734, lng: -83.2219 },
    cities: ['southfield', 'lathrup village', 'royal oak', 'ferndale', 'oak park', 'berkley', 'huntington woods', 'farmington', 'farmington hills', 'pleasant ridge'],
  },
  detroit: {
    id: 'detroit',
    name: 'Detroit',
    host: 'TechTown Detroit',
    url: 'https://techtowndetroit.org/',
    region: 'detroit-metro',
    center: { lat: 42.3314, lng: -83.0458 },
    cities: [
      'detroit', 'hamtramck', 'highland park', 'dearborn', 'dearborn heights',
      'grosse pointe', 'grosse pointe park', 'grosse pointe woods', 'grosse pointe farms',
      'harper woods', 'livonia', 'redford', 'westland', 'inkster', 'romulus', 'taylor', 'melvindale',
    ],
  },
  'traverse-city': {
    id: 'traverse-city',
    name: 'Traverse City',
    host: '20Fathoms',
    url: 'https://20fathoms.org/',
    region: 'northwest-michigan',
    center: { lat: 44.7631, lng: -85.6206 },
    cities: [
      'traverse city', 'garfield', 'acme', 'interlochen', 'suttons bay', 'leland',
      'glen arbor', 'empire', 'frankfort', 'beulah', 'elk rapids', 'bellaire',
    ],
  },
  petoskey: {
    id: 'petoskey',
    name: 'Petoskey',
    host: 'Petoskey Regional Chamber',
    url: 'https://www.petoskeychamber.com/',
    region: 'northwest-michigan',
    center: { lat: 45.3733, lng: -84.9553 },
    cities: ['petoskey', 'harbor springs', 'bay harbor', 'alanson', 'walloon lake', 'indian river'],
  },
  cadillac: {
    id: 'cadillac',
    name: 'Cadillac',
    host: 'Cadillac Area Chamber',
    url: 'https://cadillacareachamberofcommerce.growthzoneapp.com/',
    region: 'northwest-michigan',
    center: { lat: 44.2519, lng: -85.4012 },
    cities: ['cadillac', 'lake city', 'mcbain', 'reed city', 'big rapids'],
  },
  manistee: {
    id: 'manistee',
    name: 'Manistee',
    host: 'Manistee Area Chamber',
    url: 'https://www.manisteechamber.com/',
    region: 'northwest-michigan',
    center: { lat: 44.2444, lng: -86.3242 },
    cities: ['manistee', 'onekama', 'bear lake', 'ludington'],
  },
  charlevoix: {
    id: 'charlevoix',
    name: 'Charlevoix',
    host: 'Charlevoix Area Chamber',
    url: 'https://www.charlevoix.org/',
    region: 'northwest-michigan',
    center: { lat: 45.3181, lng: -85.2584 },
    cities: ['charlevoix', 'boyne city', 'boyne falls', 'east jordan'],
  },
  alpena: {
    id: 'alpena',
    name: 'Alpena',
    host: 'Alpena Area Chamber',
    url: 'https://alpenachamber.com/',
    region: 'northeast-michigan',
    center: { lat: 45.0617, lng: -83.4327 },
    cities: ['alpena', 'rogers city', 'hillman', 'atlanta'],
  },
  gaylord: {
    id: 'gaylord',
    name: 'Gaylord',
    host: 'Otsego County Economic Alliance',
    url: 'https://www.gaylord-otsego.com/',
    region: 'northeast-michigan',
    center: { lat: 45.0275, lng: -84.6747 },
    cities: ['gaylord', 'waters', 'lewiston'],
  },
  cheboygan: {
    id: 'cheboygan',
    name: 'Cheboygan',
    host: 'Cheboygan Area Chamber',
    url: 'https://www.cheboygan.com/',
    region: 'northeast-michigan',
    center: { lat: 45.6469, lng: -84.4745 },
    cities: ['cheboygan', 'mackinaw city', 'wolverine'],
  },
  grayling: {
    id: 'grayling',
    name: 'Grayling',
    host: 'Grayling Regional Chamber',
    url: 'https://www.graylingchamber.com/',
    region: 'northeast-michigan',
    center: { lat: 44.6614, lng: -84.7147 },
    cities: ['grayling', 'houghton lake', 'higgins lake', 'roscommon', 'prudenville', 'west branch'],
  },
  'oscoda-tawas': {
    id: 'oscoda-tawas',
    name: 'Oscoda/Tawas',
    host: 'Tawas Area Chamber',
    url: 'https://tawas.com/',
    region: 'northeast-michigan',
    center: { lat: 44.42, lng: -83.49 },
    cities: ['oscoda', 'east tawas', 'tawas city', 'tawas', 'au sable', 'harrisville'],
  },
};

// Longer names first so "east grand rapids" wins over "grand rapids",
// and "mount pleasant" wins over a shorter fragment.
const CITY_INDEX = [];
for (const zone of Object.values(ZONES)) {
  for (const city of zone.cities) {
    CITY_INDEX.push({ city, zoneId: zone.id });
  }
}
CITY_INDEX.sort((a, b) => b.city.length - a.city.length);

// Hudsonville sits on the GR/Holland line. Prefer Grand Rapids when both match
// only if the source zone is grand-rapids; the index lists both. First hit is
// the longer string. "hudsonville" is the same length in both lists — GR is
// registered first. Holland events that say Holland still map to Holland.

function normalizeCity(city) {
  return String(city || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function zoneForCity(city) {
  const norm = normalizeCity(city);
  if (!norm) return null;
  for (const entry of CITY_INDEX) {
    const needle = entry.city.replace(/\./g, '');
    if (norm === needle || norm.includes(needle)) return ZONES[entry.zoneId];
  }
  return null;
}

function getZone(zoneId) {
  return ZONES[zoneId] || null;
}

function getRegion(regionId) {
  const region = REGIONS[regionId];
  if (!region) return null;
  return {
    ...region,
    zones: region.zones.map((id) => {
      const zone = ZONES[id];
      return {
        id: zone.id,
        name: zone.name,
        host: zone.host,
        url: zone.url,
        center: zone.center,
      };
    }),
  };
}

function regionForZone(zoneId) {
  return ZONES[zoneId]?.region || null;
}

/**
 * Assign zone + region. Virtual or city-less events stay on the source zone.
 * A city in another SmartZone moves the event there (shared calendars).
 * A city that matches no zone is dropped unless the source allows it.
 */
function assignZone(event, source) {
  const sourceZone = getZone(source.zone);
  if (!sourceZone) return null;

  if (event.isVirtual || !normalizeCity(event.location?.city)) {
    return { ...event, zone: sourceZone.id, region: sourceZone.region };
  }

  const match = zoneForCity(event.location.city);
  if (match) {
    return { ...event, zone: match.id, region: match.region };
  }

  const allow = source.cityAllow || [];
  const city = normalizeCity(event.location.city);
  if (allow.some((c) => city.includes(normalizeCity(c)))) {
    return { ...event, zone: sourceZone.id, region: sourceZone.region };
  }

  return null;
}

module.exports = {
  REGIONS,
  ZONES,
  zoneForCity,
  getZone,
  getRegion,
  regionForZone,
  assignZone,
  normalizeCity,
};
