#!/usr/bin/env node
/**
 * Merge raw group files into per-region JSON.
 * Keeps the last good events for a source that failed, for up to 28 days.
 *
 *   node scripts/events/build.js --raw-dir raw
 */

const fs = require('fs').promises;
const path = require('path');
const { allSources } = require('./sources');
const { REGIONS, getRegion, assignZone } = require('./core/zones');
const { applyFilters } = require('./core/filters');
const { dedupeEvents } = require('./core/dedupe');
const { geocodeEvents } = require('./core/geocode');

const DATA_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'regions');
const LEGACY_FILE = path.join(__dirname, '..', '..', 'src', 'data', 'events.json');
const MANUAL_DIR = path.join(__dirname, 'manual');
const STALE_MS = 28 * 24 * 60 * 60 * 1000;

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1];
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8'));
  } catch {
    return null;
  }
}

async function collectJson(dir, into) {
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectJson(full, into);
    else if (entry.name.endsWith('.json')) into.push(full);
  }
}

async function loadRaw(rawDir) {
  const bySource = new Map();
  const files = [];
  await collectJson(rawDir, files);
  for (const file of files) {
    const payload = await readJson(file);
    for (const result of payload?.results || []) {
      bySource.set(result.sourceId, result);
    }
  }
  return bySource;
}

async function loadPrevious() {
  const bySource = new Map();
  let files = [];
  try {
    files = (await fs.readdir(DATA_DIR)).filter((name) => name.endsWith('.json') && name !== 'index.json' && name !== 'health.json');
  } catch {
    return bySource;
  }
  for (const name of files) {
    const data = await readJson(path.join(DATA_DIR, name));
    const sources = data?.sources || {};
    for (const event of data?.events || []) {
      if (!bySource.has(event.source)) bySource.set(event.source, []);
      bySource.get(event.source).push(event);
    }
    for (const [id, meta] of Object.entries(sources)) {
      const bucket = bySource.get(id) || [];
      bucket.lastSuccess = meta.lastSuccess || data.lastScraped;
      bucket.status = meta.status;
      bySource.set(id, bucket);
    }
  }
  return bySource;
}

async function loadLegacy() {
  const data = await readJson(LEGACY_FILE);
  if (!data?.events) return new Map();
  const bySource = new Map();
  for (const event of data.events) {
    if (!bySource.has(event.source)) bySource.set(event.source, []);
    bySource.get(event.source).push({ ...event, zone: 'grand-rapids', region: 'west-michigan' });
  }
  return bySource;
}

async function loadManual() {
  const events = [];
  let files = [];
  try {
    files = (await fs.readdir(MANUAL_DIR)).filter((name) => name.endsWith('.json'));
  } catch {
    return events;
  }
  const today = new Date().toISOString().slice(0, 10);
  for (const name of files) {
    const data = await readJson(path.join(MANUAL_DIR, name));
    for (const event of data?.events || []) {
      if (event.expires && event.expires < today) continue;
      events.push(event);
    }
  }
  return events;
}

function sourceMeta(source, status, error, count, lastSuccess) {
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    color: source.color,
    zone: source.zone,
    eventCount: count,
    status,
    error: error || null,
    lastSuccess,
  };
}

async function main() {
  const rawDir = arg('raw-dir') || path.join(process.cwd(), 'raw');
  const skipGeocode = process.argv.includes('--skip-geocode');
  const sources = allSources();
  const fresh = await loadRaw(rawDir);
  const previous = await loadPrevious();
  const legacy = previous.size ? new Map() : await loadLegacy();
  const now = Date.now();
  const health = {};
  const kept = [];

  for (const source of sources) {
    const result = fresh.get(source.id);
    const prior = previous.get(source.id) || legacy.get(source.id) || [];
    const priorSuccess = prior.lastSuccess || null;
    let events = [];
    let status = 'missing';
    let error = null;
    let lastSuccess = priorSuccess;

    if (result?.status === 'ok') {
      events = result.events || [];
      status = 'ok';
      lastSuccess = result.scrapedAt;
    } else if (result) {
      error = result.error;
      const age = priorSuccess ? now - new Date(priorSuccess).getTime() : Infinity;
      if (prior.length && age < STALE_MS) {
        events = prior;
        status = 'stale';
      } else {
        status = 'error';
      }
    } else if (prior.length) {
      events = prior;
      status = 'carried';
      error = null;
    }

    const filtered = [];
    for (const event of events) {
      const next = applyFilters({ ...event, source: source.id }, source);
      if (!next) continue;
      const zoned = assignZone(next, source);
      if (!zoned) continue;
      filtered.push({ ...zoned, _priority: source.priority || 0 });
    }
    health[source.id] = sourceMeta(source, status, error, filtered.length, lastSuccess);
    kept.push(...filtered);
  }

  for (const event of await loadManual()) {
    const source = sources.find((item) => item.id === event.source) || {
      id: event.source || 'manual',
      zone: event.zone,
      priority: 10,
      filterMode: 'all',
    };
    const next = applyFilters(event, source);
    if (!next) continue;
    const zoned = assignZone(next, source);
    if (zoned) kept.push({ ...zoned, _priority: source.priority || 10 });
  }

  const deduped = dedupeEvents(kept);
  const geocoded = skipGeocode ? deduped : await geocodeEvents(deduped, { maxCalls: 300 });

  const byRegion = {};
  for (const id of Object.keys(REGIONS)) byRegion[id] = [];
  for (const event of geocoded) {
    if (!byRegion[event.region]) byRegion[event.region] = [];
    byRegion[event.region].push(event);
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const scrapedAt = new Date().toISOString();
  const indexRegions = [];

  for (const [regionId, events] of Object.entries(byRegion)) {
    const region = getRegion(regionId);
    if (!region) continue;
    const regionSources = {};
    for (const source of sources) {
      const zone = region.zones.find((item) => item.id === source.zone);
      const meta = health[source.id];
      if (!zone && !events.some((event) => event.source === source.id)) continue;
      if (meta) regionSources[source.id] = meta;
    }
    const payload = {
      region,
      events,
      sources: regionSources,
      lastScraped: scrapedAt,
    };
    await fs.writeFile(path.join(DATA_DIR, `${regionId}.json`), JSON.stringify(payload, null, 2));
    indexRegions.push({
      id: region.id,
      name: region.name,
      center: region.center,
      eventCount: events.length,
      zones: region.zones,
      nextEvents: events.slice(0, 3).map((event) => ({
        title: event.title,
        date: event.date,
        zone: event.zone,
        url: `/${regionId}-events.html`,
      })),
    });
  }

  await fs.writeFile(path.join(DATA_DIR, 'health.json'), JSON.stringify({ lastScraped: scrapedAt, sources: health }, null, 2));
  await fs.writeFile(path.join(DATA_DIR, 'index.json'), JSON.stringify({ lastScraped: scrapedAt, regions: indexRegions }, null, 2));

  const counts = indexRegions.map((region) => `${region.name}: ${region.eventCount}`).join(', ');
  console.log(`Built region files. ${counts}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
