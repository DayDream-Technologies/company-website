#!/usr/bin/env node
/**
 * One-time / manual: parse docs/local-spins-free-outdoor-community-concerts-2026.md
 * into individual events, merge into src/data/summer-music-events.json (replace prior
 * source=local-spins rows), and write docs/local-spins-2026-audit-exclusions.md
 *
 * Run: node scripts/merge-local-spins-guide.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const GUIDE = path.join(ROOT, 'docs', 'local-spins-free-outdoor-community-concerts-2026.md');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'summer-music-events.json');
const EXCLUSIONS = path.join(ROOT, 'docs', 'local-spins-2026-audit-exclusions.md');
const GUIDE_URL = 'https://localspins.com/free-outdoor-community-concerts-2026/';
const SOURCE = 'local-spins';
const YEAR = 2026;

const MONTHS = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
};

/** Approximate map centers for map pins */
const CITY_COORDS = {
  Allegan: [42.5292, -85.8553],
  'Big Rapids': [43.6981, -85.4837],
  Bridgman: [41.9434, -86.5581],
  Buchanan: [41.8273, -86.2561],
  'Byron Center': [42.8122, -85.6436],
  'Grand Rapids': [42.9634, -85.6681],
  Charlotte: [42.5634, -84.8356],
  Coldwater: [41.9403, -84.9994],
  Cutlerville: [42.8408, -85.6636],
  'Elk Rapids': [44.8956, -85.3965],
  'Grand Haven': [43.0631, -86.2284],
  Haslett: [42.7470, -84.4031],
  Holland: [42.7875, -86.1089],
  Holt: [42.6731, -84.5155],
  Jenison: [42.9072, -85.8259],
  Kalamazoo: [42.2917, -85.5872],
  Kaleva: [44.3733, -86.0743],
  Kentwood: [42.8695, -85.6447],
  'Lake Orion': [42.7845, -83.2397],
  Lakeview: [43.4467, -85.1781],
  Lansing: [42.7325, -84.5555],
  Leland: [45.0220, -85.7601],
  Lowell: [42.9336, -85.3515],
  Ludington: [43.9553, -86.4526],
  Manistee: [44.2442, -86.3243],
  Mason: [42.5792, -84.4431],
  Montague: [43.4167, -86.3631],
  'Mount Pleasant': [43.5978, -84.7675],
  Muskegon: [43.2342, -86.2484],
  Okemos: [42.7123, -84.4275],
  Oshtemo: [42.3142, -85.6784],
  Parchment: [42.3278, -85.5661],
  Pentwater: [43.7825, -86.4334],
  Portage: [42.2009, -85.5900],
  Prudenville: [44.2023, -84.6516],
  Rockford: [43.1195, -85.5635],
  'St. Johns': [43.0042, -84.5596],
  Saugatuck: [42.6550, -86.2031],
  Sparta: [43.1609, -85.7090],
  'Texas Corners': [42.3214, -85.6986],
  'Three Oaks': [41.7986, -86.6106],
  'Traverse City': [44.7631, -85.6206],
  Walker: [43.0053, -85.7741],
  Wyoming: [42.9134, -85.7053],
  Zeeland: [42.8125, -86.0186],
  Cascade: [42.9129, -85.5006],
};

function parseTime(timeStr) {
  if (!timeStr) return 'TBD';
  const cleaned = timeStr.trim().replace(/\s+/g, ' ');
  let s = cleaned.replace(/(\d)\.(?=\s*p\.?m\.)/gi, '$1');
  if (/^\d{1,2}:\d{2}\s+(AM|PM)$/i.test(cleaned)) return cleaned.toUpperCase();
  const hourOnly = cleaned.match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (hourOnly) return `${hourOnly[1]}:00 ${hourOnly[2].toUpperCase()}`;
  const hm = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (hm) return `${hm[1]}:${hm[2]} ${hm[3].toUpperCase()}`;
  return cleaned.includes('Noon') ? '12:00 PM' : 'TBD';
}

function toISODateTime(date, time) {
  const tm = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!tm) return `${date}T00:00:00`;
  let hour = parseInt(tm[1], 10);
  const minute = tm[2];
  const period = tm[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${date}T${String(hour).padStart(2, '0')}:${minute}:00`;
}

function generateEventId(evtTitle, date) {
  const normalized = `${SOURCE}-${evtTitle}-${date}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  return normalized;
}

/** Map series title prefix (before first ':') to CITY_COORDS key */
const SERIES_HEAD_TO_CITY = {
  ALLEGAN: 'Allegan',
  'BIG RAPIDS': 'Big Rapids',
  BRIDGMAN: 'Bridgman',
  'BUCHANAN COMMONS': 'Buchanan',
  'BYRON CENTER': 'Byron Center',
  CASCADE: 'Cascade',
  CHARLOTTE: 'Charlotte',
  COLDWATER: 'Coldwater',
  CUTLERVILLE: 'Cutlerville',
  'ELK RAPIDS': 'Elk Rapids',
  'GRAND HAVEN': 'Grand Haven',
  HASLETT: 'Haslett',
  HOLLAND: 'Holland',
  HOLT: 'Holt',
  JENISON: 'Jenison',
  KALAMAZOO: 'Kalamazoo',
  KALEVA: 'Kaleva',
  KENTWOOD: 'Kentwood',
  'LAKE ORION': 'Lake Orion',
  LAKEVIEW: 'Lakeview',
  LANSING: 'Lansing',
  LELAND: 'Leland',
  LOWELL: 'Lowell',
  LUDINGTON: 'Ludington',
  MANISTEE: 'Manistee',
  MASON: 'Mason',
  MONTAGUE: 'Montague',
  'MOUNT PLEASANT': 'Mount Pleasant',
  MUSKEGON: 'Muskegon',
  OKEMOS: 'Okemos',
  OSHTEMO: 'Oshtemo',
  PARCHMENT: 'Parchment',
  PORTAGE: 'Portage',
  PRUDENVILLE: 'Prudenville',
  ROCKFORD: 'Rockford',
  'ST. JOHNS': 'St. Johns',
  SAUGATUCK: 'Saugatuck',
  SPARTA: 'Sparta',
  'TEXAS CORNERS': 'Texas Corners',
  'THREE OAKS': 'Three Oaks',
  'TRAVERSE CITY': 'Traverse City',
  WALKER: 'Walker',
  WYOMING: 'Wyoming',
  ZEELAND: 'Zeeland',
};

function seriesHead(title) {
  const t = title.trim();
  if (!t.includes(':')) {
    const up = t.toUpperCase();
    if (up.startsWith('OKEMOS')) return 'OKEMOS';
    return up;
  }
  return t.split(':')[0].trim().toUpperCase().replace(/\s+/g, ' ');
}

function resolveCity(seriesTitle, whereLine) {
  const head = seriesHead(seriesTitle);
  if (SERIES_HEAD_TO_CITY[head]) return SERIES_HEAD_TO_CITY[head];
  if (head.startsWith('OKEMOS')) return 'Okemos';

  const w = whereLine || '';
  const m = w.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*MI\b/);
  if (m && CITY_COORDS[m[1]]) return m[1];
  const lower = w.toLowerCase();
  if (lower.includes('friendship park') && lower.includes('grand rapids')) return 'Cascade';
  if (lower.includes('cutler park')) return 'Cutlerville';
  if (lower.includes('parchment')) return 'Parchment';
  if (lower.includes('kentwood')) return 'Kentwood';
  if (lower.includes('walker community park') || lower.includes('standale')) return 'Walker';
  if (lower.includes('millennium park')) return 'Walker';
  if (lower.includes('lamar park') && lower.includes('wyoming')) return 'Wyoming';
  if (lower.includes('jenison') || lower.includes('georgetown')) return 'Jenison';
  if (lower.includes('traverse city')) return 'Traverse City';
  return 'Grand Rapids';
}

function extractDefaultTime(whenLine) {
  if (!whenLine) return '7:00 PM';
  const m = whenLine.match(/(\d{1,2}):(\d{2})\s*p\.?\s*m\.?/i)
    || whenLine.match(/(\d{1,2})\s*p\.?\s*m\.?/i);
  if (m) {
    if (m[2] && m[2].length <= 2) {
      return parseTime(`${m[1]}:${m[2]} PM`);
    }
    return parseTime(`${m[1]} PM`);
  }
  if (/noon/i.test(whenLine)) return '12:00 PM';
  return '7:00 PM';
}

/** Grand Haven: Aug = 6:30 PM else 7 PM */
function timeForGrandHaven(monthNum, defaultT) {
  if (monthNum === 8) return parseTime('6:30 PM');
  return defaultT.includes('6:30') ? defaultT : parseTime('7:00 PM');
}

function parseMonthDayToken(token) {
  const t = token.trim().replace(/^[\s\u2013\u2014-]+/, '').replace(/(\d+)(st|nd|rd|th)\b/i, '$1');
  const re = /^([A-Za-z\.]+)\s+(\d{1,2})$/;
  const x = t.match(re);
  if (!x) return null;
  const mon = MONTHS[x[1].toLowerCase().replace(/\.$/, '')];
  if (!mon) return null;
  const day = x[2].padStart(2, '0');
  return `${YEAR}-${mon}-${day}`;
}

function splitLineupLeft(left) {
  const parts = left.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts : [left.trim()];
}

function isSkipShow(artist) {
  const a = artist.toLowerCase();
  if (/no concert/.test(a)) return true;
  if (/^rain date$/i.test(artist.trim())) return false;
  return false;
}

function isTbaLine(artist) {
  const a = artist.trim().toLowerCase();
  return a === 'tba' || a === 'to be announced' || a === 'tbd' || /^tba\s/i.test(a);
}

function parseGuide(md) {
  const exclusions = [];

  const start = md.indexOf('# FREE OUTDOOR COMMUNITY CONCERTS 2026');
  const end = md.indexOf('_Copyright 2026');
  const body = start >= 0 && end > start ? md.slice(start, end) : md;

  const lines = body.split('\n');
  const seriesList = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line || line === '---') {
      i += 1;
      continue;
    }
    if (/Photo\//.test(line) && !/LINEUP/.test(line)) {
      i += 1;
      continue;
    }

    const headerMatch = line.match(/^\*\*(.+)\*\*$/);
    if (headerMatch) {
      const inner = headerMatch[1].trim();
      if (/^(When|Where|LINEUP|DATES)\s*:/i.test(inner)) {
        i += 1;
        continue;
      }
      const isTitle = /^[A-Z]/.test(inner) && (inner.includes(':') || inner.length > 28);
      if (!isTitle) {
        i += 1;
        continue;
      }

      let title = inner;
      i += 1;
      while (i < lines.length) {
        const L = lines[i].trim();
        const hm = L.match(/^\*\*(.+)\*\*$/);
        if (hm && !/^(When|Where|LINEUP|DATES)\s*:/i.test(hm[1]) && !hm[1].includes(':') && /^[A-Z]/.test(hm[1])) {
          title += ` — ${hm[1].trim()}`;
          i += 1;
          continue;
        }
        break;
      }

      let when = '';
      let where = '';
      const lineup = [];
      let mode = 'meta';

      while (i < lines.length) {
        const L = lines[i];
        const t = L.trim();
        if (t === '---') break;

        const nextHeader = t.match(/^\*\*(.+)\*\*$/);
        if (nextHeader) {
          const inn = nextHeader[1].trim();
          if (!/^(When|Where|LINEUP|DATES)\s*:/i.test(inn) && /^[A-Z]/.test(inn) && (inn.includes(':') || inn.length > 28)) {
            break;
          }
        }

        const whenMatch = t.match(/^\*\*When:\*\*\s*(.+)$/i)
          || t.match(/^\*\*When\*\*:\s*(.+)$/i)
          || (t.startsWith('When:') ? [, t.replace(/^When:\s*/i, '').trim()] : null);
        if (whenMatch) {
          when = whenMatch[1].replace(/\*\*/g, '').trim();
          mode = 'meta';
          i += 1;
          continue;
        }
        const whereMatch = t.match(/^\*\*Where:\*\*\s*(.+)$/i)
          || t.match(/^\*\*Where\*\*:\s*(.+)$/i)
          || (t.startsWith('Where:') ? [, t.replace(/^Where:\s*/i, '').trim()] : null);
        if (whereMatch) {
          where = whereMatch[1].replace(/\*\*/g, '').trim();
          mode = 'meta';
          i += 1;
          continue;
        }
        if (/LINEUP/i.test(t) && t.length < 40) {
          mode = 'lineup';
          const rest = t.replace(/^LINEUP:\s*/i, '').trim();
          if (rest && !/^LINEUP$/i.test(rest)) lineup.push(rest);
          i += 1;
          continue;
        }
        if (/^\*\*DATES:\*\*/i.test(t) || /^DATES:/i.test(t)) {
          const rest = t.replace(/^\*\*DATES:\*\*\s*/i, '').replace(/^DATES:\s*/i, '').trim();
          lineup.push(`__DATE_NOTE__ ${rest}`);
          mode = 'lineup';
          i += 1;
          continue;
        }

        if (mode === 'lineup' && t) {
          lineup.push(t.replace(/^\*+/, '').trim());
        }
        i += 1;
      }

      seriesList.push({ title, when, where, lineup });
      continue;
    }
    i += 1;
  }

  const events = [];
  const scrapedAt = new Date().toISOString();

  for (const ser of seriesList) {
    const city = resolveCity(ser.title, ser.where);
    const coords = CITY_COORDS[city] || CITY_COORDS['Grand Rapids'];
    const defaultTime = extractDefaultTime(ser.when);
    const venueName = (ser.where || '').split(',')[0].trim() || city;
    const addressPart = (ser.where || '').includes(',') ? ser.where.split(',').slice(1).join(',').trim() : '';

    const isPentwaterCivic = /PENTWATER:\s*CIVIC BAND/i.test(ser.title);
    const isHollandLegion = /HOLLAND:\s*AMERICAN LEGION BAND SHOWS/i.test(ser.title);
    const onlyTba = ser.lineup.some((l) => /TBA/i.test(l) && ser.lineup.length <= 2);

    if (isPentwaterCivic) {
      exclusions.push({
        series: ser.title,
        reason: 'Guide lists only a date span (June 25 – August 2026) with no per-concert acts; cannot create dated events without inventing placeholder shows.',
      });
      continue;
    }
    if (isHollandLegion && onlyTba) {
      exclusions.push({
        series: ser.title,
        reason: 'Lineup is explicitly TBA with a date range only; no discrete events to import.',
      });
      continue;
    }

    for (const raw of ser.lineup) {
      if (!raw || raw.startsWith('__DATE_NOTE__')) continue;
      const row = raw.replace(/^LINEUP:\s*/i, '').trim();
      if (!row) continue;

      const mdash = row.match(/^(.+?)\s+[–—-]\s+(.+)$/);
      if (!mdash) continue;
      let left = mdash[1].trim().replace(/July\s+28-\s*/i, 'July 28 – ').replace(/August\s+12-\s*/i, 'August 12 – ');
      let artist = mdash[2].trim();

      let rowTimeOverride = null;
      const parenTimes = [...left.matchAll(/\((\d{1,2}:\d{2}\s*[AP]M)\)/gi)];
      if (parenTimes.length) {
        rowTimeOverride = parseTime(parenTimes[parenTimes.length - 1][1]);
        left = left.replace(/\s*\(\d{1,2}:\d{2}\s*[AP]M\)\s*/gi, ' ').trim();
      }

      if (isSkipShow(artist)) {
        exclusions.push({ series: ser.title, line: row, reason: 'Editor note: cancelled / no concert for this slot.' });
        continue;
      }
      if (isTbaLine(artist)) {
        exclusions.push({ series: ser.title, line: row, reason: 'Artist listed as TBA/to be announced.' });
        continue;
      }

      const dateTokens = splitLineupLeft(left);
      const dates = [];
      for (const tok of dateTokens) {
        const d = parseMonthDayToken(tok.replace(/\s+/g, ' '));
        if (d) dates.push(d);
      }
      if (!dates.length) {
        exclusions.push({ series: ser.title, line: row, reason: 'Could not parse a Month + day from lineup row.' });
        continue;
      }

      for (const date of dates) {
        let time = defaultTime;
        const mNum = parseInt(date.slice(5, 7), 10);
        if (/Music on the Grand/i.test(ser.title)) {
          time = timeForGrandHaven(mNum, defaultTime);
        }
        if (rowTimeOverride) {
          time = rowTimeOverride;
        }
        const specialTime = artist.match(/^(\d{1,2}:\d{2}\s*[AP]M)\s*\)?\s*[–—-]\s*(.+)$/i)
          || artist.match(/^\((\d{1,2}:\d{2}\s*[AP]M)\)\s*(.+)$/i);
        if (specialTime) {
          time = parseTime(specialTime[1]);
          artist = specialTime[2].trim();
        }
        if (ser.title.includes('Great Scott') && date.startsWith('2026-08')) {
          time = parseTime('6:30 PM');
        }

        const title = artist.replace(/\s*\([^)]*\)\s*$/, '').trim() || artist;
        const description = [
          `Part of: ${ser.title.replace(/\*\*/g, '')}`,
          ser.when ? `Schedule: ${ser.when}` : '',
          ser.where ? `Where: ${ser.where}` : '',
        ].filter(Boolean).join(' · ');

        events.push({
          id: generateEventId(title, date),
          title,
          description,
          date,
          time,
          startDateTime: toISODateTime(date, time),
          location: {
            name: venueName,
            address: addressPart || '',
            city,
            state: 'MI',
            lat: coords[0],
            lng: coords[1],
          },
          url: GUIDE_URL,
          source: SOURCE,
          category: 'outdoor',
          isRecurring: false,
          isFree: true,
          scrapedAt,
          guideSeries: ser.title.replace(/\*\*/g, ''),
        });
      }
    }
  }

  return { events, exclusions, seriesParsed: seriesList.length };
}

function dedupe(events) {
  const map = new Map();
  for (const e of events) {
    const k = e.id;
    if (!map.has(k)) map.set(k, e);
  }
  return [...map.values()];
}

function main() {
  const md = fs.readFileSync(GUIDE, 'utf8');
  const { events: newLs, exclusions, seriesParsed } = parseGuide(md);
  let uniqueNew = dedupe(newLs);

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const kept = data.events.filter((e) => e.source !== SOURCE);
  const merged = [...kept, ...uniqueNew];

  merged.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const sources = { ...data.sources };
  sources[SOURCE] = {
    id: SOURCE,
    name: 'Local Spins (2026 guide — manual import)',
    url: GUIDE_URL,
    color: '#E91E63',
    eventCount: uniqueNew.length,
    lastScraped: new Date().toISOString(),
    note: 'Not scraped automatically; merged from docs/local-spins-free-outdoor-community-concerts-2026.md',
  };

  const out = {
    events: merged,
    lastScraped: data.lastScraped,
    sources,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(out, null, 2));

  const exMd = [`# Local Spins 2026 guide — audit exclusions

Source: ${GUIDE_URL}

This file was generated by \`scripts/merge-local-spins-guide.mjs\` during a **one-time audit**. Local Spins is **not** part of the automated summer-music scrape.

## Summary

- Series sections scanned: **${seriesParsed}**
- Events imported (\`source: local-spins\`): **${uniqueNew.length}**
- Rows/series skipped (below): **${exclusions.length}**

## Skipped lineup rows / series

${exclusions.length === 0 ? '_None._' : exclusions.map((e) => `- **${(e.series || '—').slice(0, 120)}**${e.line ? ` — \`${e.line.replace(/`/g, "'").slice(0, 140)}\`` : ''}  
  *${e.reason}*`).join('\n\n')}

## Parser limitations

- Times use the primary time on each series’ **When** line; **Grand Haven (Music on the Grand)** uses 6:30 PM in August vs 7:00 PM earlier in summer per the guide.
- **Venues** collapse to series-level place; Lansing moves between parks appear in the lineup text inside descriptions when present.
- If the guide is updated after this snapshot (\`docs/local-spins-free-outdoor-community-concerts-2026.md\`), re-run the merge script or edit JSON manually.
`];

  fs.writeFileSync(EXCLUSIONS, exMd.join('\n'));

  console.log(`Series blocks: ${seriesParsed}`);
  console.log(`New Local Spins events: ${uniqueNew.length}`);
  console.log(`Total events in file: ${merged.length}`);
  console.log(`Exclusions written: ${EXCLUSIONS}`);
}

main();
