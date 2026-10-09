/**
 * HTTP fetch with a browser User-Agent, timeout, and retries.
 */

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const lastHostHit = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

async function waitForHost(url, gapMs) {
  const host = hostOf(url);
  const last = lastHostHit.get(host) || 0;
  const wait = gapMs - (Date.now() - last);
  if (wait > 0) await delay(wait);
  lastHostHit.set(host, Date.now());
}

async function fetchText(url, options = {}) {
  const {
    timeoutMs = 20000,
    retries = 2,
    googlebot = false,
    headers = {},
    minHostGapMs = 400,
    accept = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  } = options;

  await waitForHost(url, minHostGapMs);

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': googlebot ? GOOGLEBOT_UA : CHROME_UA,
          Accept: accept,
          'Accept-Language': 'en-US,en;q=0.9',
          ...headers,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error.name === 'AbortError' ? new Error(`Timeout for ${url}`) : error;
      if (attempt < retries) await delay(800 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function fetchJson(url, options = {}) {
  const text = await fetchText(url, {
    ...options,
    accept: 'application/json,text/plain,*/*',
  });
  return JSON.parse(text);
}

module.exports = {
  CHROME_UA,
  delay,
  fetchText,
  fetchJson,
};
