const { scrapeChamberMaster } = require('./chamber');

async function scrape(source) {
  return scrapeChamberMaster({
    ...source,
    options: { ...source.options, googlebot: true },
  });
}

module.exports = { scrape };
