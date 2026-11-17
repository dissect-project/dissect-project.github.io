import { load } from 'js-yaml';
import siteRaw from '../data/site.yaml?raw';
import partnersRaw from '../data/partners.yaml?raw';

export interface Featured {
  name: string;
  description?: string;
  paper?: string;
}

export interface Site {
  name: string;
  fullName: string;
  url: string;
  mission: string;
  description: string;
  about: string[];
  lab: { name: string; url?: string };
  university: { name: string; url?: string };
  contact: { email: string; address: string[] };
  github: { org: string };
  research: { title: string; description: string }[];
  repos: { exclude?: string[]; featured?: Featured[] };
}

export interface Partner {
  name: string;
  url?: string;
  logo?: string;
  description?: string;
}

export const site = load(siteRaw) as Site;
export const partners: Partner[] = ((load(partnersRaw) as { partners?: Partner[] } | null)?.partners ?? []).filter(
  (p) => p && p.name,
);

/** True for values that are still placeholders. */
export const isTodo = (v?: string) => !v || /^\s*TODO\b/i.test(v);

export const githubOrgUrl = `https://github.com/${site.github.org}`;
