/**
 * Cross-source duplicate detection. Higher source priority wins.
 */

function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeKey(event) {
  return `${normalizeTitle(event.title)}|${event.date}`;
}

/**
 * @param {Array} events events that already have a numeric `_priority`
 * @returns {Array} winners with `alsoListedBy` source ids
 */
function dedupeEvents(events) {
  const groups = new Map();
  for (const event of events) {
    const key = dedupeKey(event);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }

  const winners = [];
  for (const group of groups.values()) {
    group.sort((a, b) => (b._priority || 0) - (a._priority || 0));
    const [best, ...rest] = group;
    const alsoListedBy = [...new Set(rest.map((e) => e.source).filter((id) => id && id !== best.source))];
    const { _priority, ...clean } = best;
    winners.push({ ...clean, alsoListedBy });
  }

  winners.sort((a, b) => String(a.startDateTime).localeCompare(String(b.startDateTime)));
  return winners;
}

module.exports = { normalizeTitle, dedupeKey, dedupeEvents };
