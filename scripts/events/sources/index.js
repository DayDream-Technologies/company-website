const shared = require('./shared');
const upperPeninsula = require('./upper-peninsula');
const westMichigan = require('./west-michigan');
const eastCentral = require('./east-central');
const eastMichigan = require('./east-michigan');
const southCentral = require('./south-central');
const southwest = require('./southwest');
const southeast = require('./southeast');
const detroitMetro = require('./detroit-metro');
const northwestMichigan = require('./northwest-michigan');
const northeastMichigan = require('./northeast-michigan');

const ALL = [
  ...shared,
  ...upperPeninsula,
  ...westMichigan,
  ...eastCentral,
  ...eastMichigan,
  ...southCentral,
  ...southwest,
  ...southeast,
  ...detroitMetro,
  ...northwestMichigan,
  ...northeastMichigan,
];

function allSources() {
  return ALL;
}

function sourcesForGroup(group, { headless = false } = {}) {
  return ALL.filter((source) => {
    if (headless) return source.headless;
    return source.group === group && !source.headless;
  });
}

function sourceById(id) {
  return ALL.find((source) => source.id === id) || null;
}

const GROUPS = [
  'upper-peninsula',
  'west-michigan',
  'east-central',
  'east-michigan',
  'south-central',
  'southwest',
  'southeast',
  'detroit-metro',
  'northwest-michigan',
  'northeast-michigan',
  'shared',
];

module.exports = { allSources, sourcesForGroup, sourceById, GROUPS };
