const cheerio = require('cheerio');
const { fetchText, delay } = require('../../core/fetch');
const { makeEvent, parseDate, parseTime, inferYear, cleanText, stripHtml } = require('../../core/normalize');

function pushEvent(events, source, partial) {
  const event = makeEvent({ source: source.id, ...partial });
  if (event) events.push(event);
}

async function scrapeSpark(source) {
  const events = [];
  const seen = new Set();
  for (let page = 1; page <= (source.options.pages || 3); page++) {
    const url = page === 1 ? source.url : `${source.url}${source.url.includes('?') ? '&' : '?'}_paged=${page}`;
    const html = await fetchText(url);
    const $ = cheerio.load(html);
    $('a[href*="/event/"]').each((_, el) => {
      const href = $(el).attr('href');
      const title = cleanText($(el).text());
      if (!href || !title || title.length < 4 || seen.has(href) || /\/events\//.test(href)) return;
      const card = cleanText($(el).closest('.content-item, article, li').text());
      const date = parseDate(card) || inferYear(card);
      if (!date) return;
      seen.add(href);
      const time = (card.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i) || [])[1];
      pushEvent(events, source, {
        title,
        description: card.slice(0, 400),
        date,
        time: time ? parseTime(time) : 'TBD',
        city: /ypsilanti/i.test(card) ? 'Ypsilanti' : 'Ann Arbor',
        url: new URL(href, source.url).toString(),
      });
    });
    await delay(400);
  }
  return events;
}

async function scrapeGvsuModule(source) {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const events = [];
  $('a[href*="/event/"]').each((_, el) => {
    const href = $(el).attr('href');
    const block = cleanText($(el).closest('article, li, .event, div').text()) || cleanText($(el).text());
    const title = cleanText($(el).text()) || block.slice(0, 80);
    const date = parseDate(block);
    if (!title || !date) return;
    pushEvent(events, source, {
      title,
      date,
      time: (block.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i) || [])[1] || 'TBD',
      city: source.options.defaultCity || '',
      url: new URL(href, source.url).toString(),
      description: block.slice(0, 300),
    });
  });
  return events;
}

async function scrapeLinkList(source) {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const events = [];
  const pattern = new RegExp(source.options.linkPattern, 'i');
  $(source.options.itemSelector || 'a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!pattern.test(href) && !pattern.test($(el).text())) return;
    const block = cleanText($(el).closest(source.options.blockSelector || 'li, article, tr, p, div').text());
    const title = cleanText($(el).text()) || block.slice(0, 100);
    const date = parseDate(block) || inferYear(block);
    if (!title || title.length < 4 || !date) return;
    pushEvent(events, source, {
      title,
      date,
      time: (block.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i) || [])[1] || 'TBD',
      city: source.options.defaultCity || '',
      url: href.startsWith('http') ? href : new URL(href || source.url, source.url).toString(),
      description: block.slice(0, 300),
    });
  });
  return events;
}

async function scrapePropeller(source) {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const events = [];
  $('h1, h2, h3, h4, p, .event').each((_, el) => {
    const text = cleanText($(el).text());
    const date = parseDate(text);
    if (!date || text.length < 8 || text.length > 240) return;
    pushEvent(events, source, {
      title: text.replace(date, '').slice(0, 140) || text.slice(0, 140),
      date,
      city: /flint/i.test(text) ? 'Flint' : 'Port Huron',
      url: source.url,
      description: text,
    });
  });
  return events;
}

async function scrapeEda(source) {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const events = [];
  $('a, li, article, .event').each((_, el) => {
    const text = cleanText($(el).text());
    const date = parseDate(text);
    if (!date || text.length > 200) return;
    pushEvent(events, source, {
      title: text.slice(0, 140),
      date,
      city: 'Port Huron',
      url: $(el).attr('href') ? new URL($(el).attr('href'), source.url).toString() : source.url,
    });
  });
  return events;
}

async function scrapeNef(source) {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const events = [];
  $('article, .event, li, h2, h3').each((_, el) => {
    const text = cleanText($(el).text());
    const date = parseDate(text);
    if (!date) return;
    const title = cleanText($(el).find('a, h2, h3').first().text()) || text.slice(0, 120);
    pushEvent(events, source, {
      title,
      date,
      city: 'Ann Arbor',
      url: source.url,
      description: text.slice(0, 300),
    });
  });
  return events;
}

async function scrapeOaklandThrive(source) {
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const events = [];
  $('a[href*="/etn/"], article, .event').each((_, el) => {
    const text = cleanText($(el).text());
    const date = parseDate(text) || inferYear(text);
    const title = cleanText($(el).find('h2, h3, .entry-title').first().text()) || text.slice(0, 120);
    if (!date || title.length < 4) return;
    const href = $(el).attr('href') || $(el).find('a').attr('href');
    pushEvent(events, source, {
      title,
      date,
      city: /ferndale/i.test(text) ? 'Ferndale' : 'Rochester Hills',
      url: href ? new URL(href, source.url).toString() : source.url,
      description: text.slice(0, 240),
    });
  });
  return events;
}

async function scrapeVelocity(source) {
  const html = await fetchText(source.url);
  const events = [];
  const courseRe = /"coursePrice"\s*:\s*"(\d{1,2})\.(\d{1,2})\.(\d{4})"/g;
  const titles = [...html.matchAll(/"title"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  let index = 0;
  for (const match of html.matchAll(courseRe)) {
    const date = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    pushEvent(events, source, {
      title: titles[index] || `Velocity event ${date}`,
      date,
      city: 'Sterling Heights',
      url: source.url,
    });
    index += 1;
  }
  if (events.length) return events;
  const $ = cheerio.load(html);
  $('h2, h3, a').each((_, el) => {
    const text = cleanText($(el).text());
    const date = parseDate(text);
    if (!date) return;
    pushEvent(events, source, { title: text.slice(0, 140), date, city: 'Sterling Heights', url: source.url });
  });
  return events;
}

async function scrapeBattleCreek(source) {
  const html = await fetchText(source.url);
  const text = stripHtml(html);
  const events = [];
  const monthRe = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/gi;
  const parts = text.split(monthRe);
  // split keeps captures: [pre, Month, Year, body, Month, Year, body...]
  for (let i = 1; i < parts.length; i += 3) {
    const month = parts[i];
    const year = parts[i + 1];
    const body = parts[i + 2] || '';
    const itemRe = /(\d{1,2})(?:st|nd|rd|th)?\s+([^0-9]{6,120}?)(?=\d{1,2}(?:st|nd|rd|th)?\s+[A-Z]|$)/g;
    for (const item of body.matchAll(itemRe)) {
      const date = parseDate(`${month} ${item[1]}, ${year}`);
      pushEvent(events, source, {
        title: cleanText(item[2]),
        date,
        city: 'Battle Creek',
        url: source.url,
      });
    }
  }
  return events;
}

async function scrapeAlpenaChamber(source) {
  const html = await fetchText(source.url, { googlebot: true });
  const $ = cheerio.load(html);
  const events = [];
  const seen = new Set();
  const city = source.options.defaultCity || 'Alpena';
  $('li, p, article, .event, h2, h3, h4').each((_, el) => {
    const text = cleanText($(el).text());
    if (!text || text.length < 8 || text.length > 240) return;
    const date = parseDate(text) || inferYear(text);
    if (!date || seen.has(`${text}|${date}`)) return;
    const title = text.replace(/[A-Za-z]+\.?\s+\d{1,2},?\s+\d{4}/, '').replace(/\s+/g, ' ').trim();
    if (title.length < 4) return;
    seen.add(`${text}|${date}`);
    const time = (text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i) || [])[1];
    pushEvent(events, source, {
      title: title.slice(0, 140),
      date,
      time: time ? parseTime(time) : 'TBD',
      city,
      url: source.url,
    });
  });
  return events;
}

async function scrapeStartupDetroit(source) {
  const html = await fetchText(source.url);
  const events = [];
  const match = html.match(/"startDate"\s*:\s*"([^"]+)"/);
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (match) {
    pushEvent(events, source, {
      title: cleanText(titleMatch?.[1] || 'Startup Detroit Happy Hour'),
      date: match[1].slice(0, 10),
      time: match[1].includes('T') ? parseTime(match[1].slice(11, 16)) : 'TBD',
      city: 'Detroit',
      url: source.url,
      isRecurring: true,
      recurringKnown: true,
    });
  }
  return events;
}

const FNS = {
  scrapeSpark,
  scrapeGvsuModule,
  scrapeLinkList,
  scrapePropeller,
  scrapeEda,
  scrapeNef,
  scrapeOaklandThrive,
  scrapeVelocity,
  scrapeBattleCreek,
  scrapeStartupDetroit,
  scrapeAlpenaChamber,
};

async function scrape(source) {
  const fn = FNS[source.options.fn];
  if (!fn) throw new Error(`Unknown page scraper ${source.options.fn}`);
  return fn(source);
}

module.exports = { scrape, FNS };
