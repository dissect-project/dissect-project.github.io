import { loadRepos, filterRepos } from '../../scripts/repos-lib.mjs';
import { site, isTodo } from './site';
import cache from '../data/repos.cache.json';

export interface Repo {
  name: string;
  description: string;
  language: string;
  stars: number;
  pushedAt: string;
  url: string;
  homepage: string;
  featured?: { description?: string; paper?: string };
}

let cached: Promise<{ repos: Repo[]; source: string; fetchedAt: string | null }> | undefined;

/** Fetched once per build; falls back to src/data/repos.cache.json. */
export function getRepos() {
  cached ??= (async () => {
    const { repos, source, fetchedAt } = await loadRepos(site.github.org, cache);
    const visible = filterRepos(repos, site.github.org, site.repos?.exclude ?? []) as Repo[];
    const featured = site.repos?.featured ?? [];
    const rank = (r: Repo) => {
      const i = featured.findIndex((f) => f.name.toLowerCase() === r.name.toLowerCase());
      return i === -1 ? Infinity : i;
    };
    for (const r of visible) {
      const f = featured.find((f) => f.name.toLowerCase() === r.name.toLowerCase());
      if (f) {
        r.featured = {
          description: isTodo(f.description) ? undefined : f.description,
          paper: isTodo(f.paper) ? undefined : f.paper,
        };
      }
    }
    visible.sort((a, b) => rank(a) - rank(b) || b.pushedAt.localeCompare(a.pushedAt));
    return { repos: visible, source, fetchedAt };
  })();
  return cached;
}
