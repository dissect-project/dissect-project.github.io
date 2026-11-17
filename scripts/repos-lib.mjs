// Shared GitHub repository fetching, used by the build (src/lib/github.ts)
// and by `npm run refresh-repos` (scripts/refresh-repos.mjs).
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const CACHE_PATH = fileURLToPath(new URL('../src/data/repos.cache.json', import.meta.url));

const ALWAYS_EXCLUDE = ['.github'];

/** Keep only the fields the site renders. */
function slim(r) {
  return {
    name: r.name,
    description: r.description ?? '',
    language: r.language ?? '',
    stars: r.stargazers_count ?? 0,
    pushedAt: r.pushed_at,
    url: r.html_url,
    homepage: r.homepage || '',
    archived: Boolean(r.archived),
    fork: Boolean(r.fork),
  };
}

/** Fetch all public repos of an org. Throws on network/HTTP errors. */
export async function fetchOrgRepos(org, { token = process.env.GITHUB_TOKEN, timeoutMs = 10000 } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'dissect-website-build',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?type=public&per_page=100&page=${page}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      throw new Error(`GitHub API ${res.status} ${res.statusText}${remaining === '0' ? ' (rate limited)' : ''}`);
    }
    const batch = await res.json();
    repos.push(...batch.map(slim));
    if (batch.length < 100) break;
  }
  return repos;
}

export async function readCache() {
  try {
    return JSON.parse(await readFile(CACHE_PATH, 'utf8'));
  } catch {
    return { fetchedAt: null, repos: [] };
  }
}

export async function writeCache(repos) {
  const data = { fetchedAt: new Date().toISOString(), repos };
  await writeFile(CACHE_PATH, JSON.stringify(data, null, 2) + '\n');
  return data;
}

/** Apply the site's visibility rules. */
export function filterRepos(repos, org, exclude = []) {
  const hidden = new Set([...ALWAYS_EXCLUDE, `${org}.github.io`, ...exclude].map((n) => n.toLowerCase()));
  return repos.filter((r) => !r.archived && !r.fork && !hidden.has(r.name.toLowerCase()));
}

/**
 * Live data if possible, otherwise the committed cache. Never throws.
 * `fallback` lets bundled callers pass the cache they imported statically
 * (CACHE_PATH is not valid once this module is bundled by Vite).
 */
export async function loadRepos(org, fallback) {
  try {
    const repos = await fetchOrgRepos(org);
    return { source: 'live', fetchedAt: new Date().toISOString(), repos };
  } catch (err) {
    const cache = fallback ?? (await readCache());
    console.warn(`[repos] GitHub fetch failed (${err.message}); using cache from ${cache.fetchedAt ?? 'never'}.`);
    return { source: 'cache', fetchedAt: cache.fetchedAt, repos: cache.repos };
  }
}
