#!/usr/bin/env node
/**
 * Scrape one source group (or every headless source) and write raw JSON.
 *
 *   node scripts/events/run.js --group west-michigan --out raw/west-michigan.json
 *   node scripts/events/run.js --all
 *   node scripts/events/run.js --headless --out raw/headless.json
 *   node scripts/events/run.js --source techtown --dry-run
 */

const fs = require('fs').promises;
const path = require('path');
const { getAdapter } = require('./adapters');
const { allSources, sourcesForGroup, sourceById, GROUPS } = require('./sources');
const { delay } = require('./core/fetch');

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) return true;
  return value;
}

async function scrapeSource(source) {
  const started = Date.now();
  try {
    const scrape = getAdapter(source.adapter);
    const events = await scrape(source);
    console.log(`  ok ${source.id}: ${events.length} events (${Math.round((Date.now() - started) / 1000)}s)`);
    return {
      sourceId: source.id,
      status: 'ok',
      error: null,
      scrapedAt: new Date().toISOString(),
      events,
    };
  } catch (error) {
    console.warn(`  fail ${source.id}: ${error.message}`);
    return {
      sourceId: source.id,
      status: 'error',
      error: error.message,
      scrapedAt: new Date().toISOString(),
      events: [],
    };
  }
}

async function main() {
  const group = arg('group');
  const sourceId = arg('source');
  const headless = process.argv.includes('--headless');
  const all = process.argv.includes('--all');
  const dryRun = process.argv.includes('--dry-run');
  const out = arg('out');

  if (all && !(group && group !== true) && !(sourceId && sourceId !== true) && !headless) {
    for (const groupName of GROUPS) {
      const groupSources = sourcesForGroup(groupName);
      console.log(`\n# ${groupName} (${groupSources.length})`);
      const results = [];
      for (const source of groupSources) {
        console.log(`- ${source.name}`);
        results.push(await scrapeSource(source));
        await delay(800);
      }
      if (!dryRun) {
        const outPath = `raw/${groupName}.json`;
        await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
        await fs.writeFile(outPath, JSON.stringify({
          group: groupName,
          scrapedAt: new Date().toISOString(),
          results,
        }, null, 2));
        console.log(`Wrote ${outPath}`);
      }
    }
    return;
  }

  let sources;
  if (sourceId && sourceId !== true) sources = [sourceById(sourceId)].filter(Boolean);
  else if (headless) sources = allSources().filter((source) => source.headless);
  else if (group && group !== true) sources = sourcesForGroup(group);
  else {
    console.error('Pass --group, --source, --headless, or --all');
    process.exit(1);
  }
  if (!sources.length) {
    console.error('No sources matched');
    process.exit(1);
  }

  console.log(`Scraping ${sources.length} source(s)${dryRun ? ' (dry run)' : ''}`);
  const results = [];
  for (const source of sources) {
    console.log(`- ${source.name}`);
    results.push(await scrapeSource(source));
    await delay(800);
  }

  const payload = {
    group: headless ? 'headless' : group || sourceId,
    scrapedAt: new Date().toISOString(),
    results,
  };

  if (out && out !== true) {
    await fs.mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await fs.writeFile(out, JSON.stringify(payload, null, 2));
    console.log(`Wrote ${out}`);
  } else if (dryRun) {
    for (const result of results) {
      console.log(`${result.sourceId}: ${result.status} ${result.events.length}${result.error ? ` (${result.error})` : ''}`);
    }
  } else {
    process.stdout.write(JSON.stringify(payload));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
