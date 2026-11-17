// Refresh the committed fallback cache: `npm run refresh-repos`
// Set GITHUB_TOKEN to avoid the unauthenticated rate limit.
import { load } from 'js-yaml';
import { readFile } from 'node:fs/promises';
import { fetchOrgRepos, writeCache, CACHE_PATH } from './repos-lib.mjs';

const site = load(await readFile(new URL('../src/data/site.yaml', import.meta.url), 'utf8'));
const repos = await fetchOrgRepos(site.github.org);
await writeCache(repos);
console.log(`Wrote ${repos.length} repos to ${CACHE_PATH}`);
