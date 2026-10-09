const { scrapeChamberMaster } = require('./chamber');

async function scrape(source) {
  return scrapeChamberMaster(source);
}

module.exports = { scrape };
