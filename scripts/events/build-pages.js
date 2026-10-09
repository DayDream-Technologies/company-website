#!/usr/bin/env node
/**
 * Generate one static region page per SmartZone region from page-template.html.
 */

const fs = require('fs');
const path = require('path');
const { REGIONS } = require('./core/zones');

const templatePath = path.join(__dirname, 'page-template.html');
const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(templatePath, 'utf8');

function pageFor(region) {
  const file = `${region.id}-events.html`;
  const title = `${region.name} Entrepreneurship & Networking Events`;
  const description = `Entrepreneurship and networking events across Michigan's ${region.name} SmartZone region. Calendar, list, and map views, updated every other Monday.`;
  let html = template;
  html = html.replaceAll('gr-events.html', file);
  html = html.replaceAll('GR Events Calendar | Grand Rapids Community Events by DayDream Technologies', `${title} | DayDream Technologies`);
  html = html.replaceAll('GR Events Calendar | Grand Rapids Community Events', title);
  html = html.replaceAll('Discover Grand Rapids community events in one place. Interactive calendar, map view, and list view. Filter by category and export to your calendar.', description);
  html = html.replaceAll('Grand Rapids events, GR events calendar, community events Michigan, things to do Grand Rapids, local events', `${region.name} events, Michigan SmartZone, entrepreneurship, networking`);
  html = html.replace('<body>', `<body data-region="${region.id}">`);
  html = html.replaceAll('GR Events Calendar', title);
  html = html.replaceAll('Interactive calendar aggregating community events from across Grand Rapids, Michigan. Features calendar view, map view, list view, category filtering, and calendar export.', description);
  html = html.replaceAll('Discover Grand Rapids community events in one place. Interactive calendar, map view, and list view.', description);
  html = html.replace('>GR Events<', `>${region.name}<`);
  html = html.replace('Startup &amp; Entrepreneurship Events', 'Entrepreneurship and networking');
  html = html.replace('Startup & Entrepreneurship Events', 'Entrepreneurship and networking');
  html = html.replace('Built for the Grand Rapids startup community', `Built for the ${region.name} startup community`);
  html = html.replace(
    'Events are updated every other Monday morning',
    'Events are updated every other Monday morning &nbsp;&middot;&nbsp; <a href="/michigan-events.html" style="color: inherit;">All Michigan SmartZones</a>'
  );
  return html;
}

for (const region of Object.values(REGIONS)) {
  const file = path.join(root, `${region.id}-events.html`);
  fs.writeFileSync(file, pageFor(region));
  console.log(`Wrote ${region.id}-events.html`);
}
