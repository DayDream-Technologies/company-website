const { scrapeGrowthZone } = require('./chamber');

async function scrape(source) {
  return scrapeGrowthZone(source);
}

module.exports = { scrape };
