import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const DEFAULT_TOPICS = ['Apple'];
export const DEFAULT_EXCLUDE_PATTERNS = ['Mrs. GREEN APPLE'];
const KEYWORDS_FILE = resolve(new URL('../../config/keywords.json', import.meta.url).pathname);

async function loadKeywordsFile() {
  try {
    const raw = await readFile(KEYWORDS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function normalizeTopics(input) {
  const topics = (input || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  return topics.length > 0 ? [...new Set(topics)] : [...DEFAULT_TOPICS];
}

function normalizeExcludePatterns(input) {
  const patterns = (input || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  return patterns.length > 0 ? [...new Set(patterns)] : [...DEFAULT_EXCLUDE_PATTERNS];
}

export async function getConfiguredTopics() {
  if (process.env.TREND_TOPICS && process.env.TREND_TOPICS.trim()) {
    return normalizeTopics(process.env.TREND_TOPICS);
  }

  const keywords = await loadKeywordsFile();
  if (Array.isArray(keywords.topics) && keywords.topics.length > 0) {
    return [...new Set(keywords.topics.map((x) => String(x).trim()).filter(Boolean))];
  }

  return [...DEFAULT_TOPICS];
}

export async function getConfiguredExcludePatterns() {
  if (process.env.TREND_EXCLUDE_PATTERNS && process.env.TREND_EXCLUDE_PATTERNS.trim()) {
    return normalizeExcludePatterns(process.env.TREND_EXCLUDE_PATTERNS);
  }

  const keywords = await loadKeywordsFile();
  if (Array.isArray(keywords.excludePatterns) && keywords.excludePatterns.length > 0) {
    return [...new Set(keywords.excludePatterns.map((x) => String(x).trim()).filter(Boolean))];
  }

  return [...DEFAULT_EXCLUDE_PATTERNS];
}

function buildGoogleNewsQuery(topics) {
  const query = `(${topics.join(' OR ')}) when:1d`;
  return encodeURIComponent(query);
}

export function buildGoogleNewsSearchFeedUrlEn(topics) {
  const encoded = buildGoogleNewsQuery(topics);
  return `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
}

export function buildGoogleNewsSearchFeedUrlJa(topics) {
  const encoded = buildGoogleNewsQuery(topics);
  return `https://news.google.com/rss/search?q=${encoded}&hl=ja&gl=JP&ceid=JP:ja`;
}

export function buildGoogleNewsSearchFeedUrl(topics) {
  // Backward compatibility for existing imports.
  return buildGoogleNewsSearchFeedUrlEn(topics);
}
