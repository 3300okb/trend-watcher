import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const DEFAULT_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'claude', 'codex', 'gemini', 'frontend'];
const ENV_FILE = resolve(new URL('../../.env', import.meta.url).pathname);

function parseEnvText(text) {
  const map = {};
  for (const line of (text || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    map[key] = value;
  }
  return map;
}

async function loadEnvFile() {
  try {
    const raw = await readFile(ENV_FILE, 'utf8');
    return parseEnvText(raw);
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

export async function getConfiguredTopics() {
  if (process.env.TREND_TOPICS && process.env.TREND_TOPICS.trim()) {
    return normalizeTopics(process.env.TREND_TOPICS);
  }

  const envMap = await loadEnvFile();
  return normalizeTopics(envMap.TREND_TOPICS || '');
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
