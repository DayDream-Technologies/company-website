const tribeApi = require('./tribe-api');
const chambermaster = require('./chambermaster');
const growthzone = require('./growthzone');
const eventbrite = require('./eventbrite-organizer');
const luma = require('./luma-ics');
const meetup = require('./meetup-ics');
const ics = require('./ics');
const localist = require('./localist');
const livewhale = require('./livewhale');
const umich = require('./umich-happening');
const squarespace = require('./squarespace-json');
const weblink = require('./weblink-atlas');
const chambermate = require('./chambermate');
const wix = require('./wix-gcal');
const sitemap = require('./sitemap-jsonld');
const gr = require('./custom/gr');
const pages = require('./custom/pages');
const blackthorn = require('./headless/blackthorn');
const chamberdata = require('./headless/chamberdata');

const ADAPTERS = {
  'tribe-api': tribeApi.scrape,
  chambermaster: chambermaster.scrape,
  growthzone: growthzone.scrape,
  'eventbrite-organizer': eventbrite.scrape,
  'luma-ics': luma.scrape,
  'meetup-ics': meetup.scrape,
  ics: ics.scrape,
  localist: localist.scrape,
  livewhale: livewhale.scrape,
  'umich-happening': umich.scrape,
  'squarespace-json': squarespace.scrape,
  'weblink-atlas': weblink.scrape,
  chambermate: chambermate.scrape,
  'wix-gcal': wix.scrape,
  'sitemap-jsonld': sitemap.scrape,
  'custom-gr': gr.scrape,
  'custom-page': pages.scrape,
  'headless-blackthorn': blackthorn.scrape,
  'headless-chamberdata': chamberdata.scrape,
};

function getAdapter(name) {
  const scrape = ADAPTERS[name];
  if (!scrape) throw new Error(`Unknown adapter ${name}`);
  return scrape;
}

module.exports = { ADAPTERS, getAdapter };
