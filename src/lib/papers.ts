import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initSync, parse, type Entry, type Name } from '@retorquere/bibtex-parser';
import bibRaw from '../data/papers.bib?raw';
import { nameKey } from './team';

export type PubType = 'journal' | 'conference' | 'workshop' | 'other';

export interface Author {
  display: string;
  key: string;
}

export interface Paper {
  key: string;
  type: PubType;
  title: string; // sanitised HTML (only <i>, <b>, <sup>, <sub>)
  authors: Author[];
  venue: string;
  year: number | null;
  month: number | null;
  doi?: string;
  url?: string;
  pdf?: string;
  code?: string;
  slides?: string;
  bibtex: string;
}

export const typeLabels: Record<PubType, string> = {
  journal: 'Journal',
  conference: 'Conference',
  workshop: 'Workshop',
  other: 'Other',
};

let ready = false;
function ensureInit() {
  if (ready) return;
  const wasm = join(process.cwd(), 'node_modules/@retorquere/bibtex-parser/dist/bibtex_parser_bg.wasm');
  initSync({ module: readFileSync(wasm) });
  ready = true;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Escape everything, then re-allow a handful of attribute-less formatting tags. */
export function safeInlineHtml(s: string) {
  return escapeHtml(s)
    .replace(/&lt;(\/?)(i|b|em|strong|sup|sub)&gt;/g, '<$1$2>')
    .replace(/&lt;\/?span[^&]*&gt;/g, '');
}

const str = (v: unknown): string => (typeof v === 'string' ? v : Array.isArray(v) ? v.join(', ') : '');

const httpUrl = (v: unknown) => {
  const s = str(v).trim();
  return /^https?:\/\//i.test(s) ? s : undefined;
};

function authorOf(n: Name): Author {
  if (n.name) return { display: n.name, key: nameKey(n.name, n.name) };
  const first = n.firstName ?? '';
  const last = [n.prefix, n.lastName, n.suffix].filter(Boolean).join(' ');
  return { display: [first, last].filter(Boolean).join(' '), key: nameKey(first, n.lastName ?? '') };
}

function typeOf(e: Entry): PubType {
  const override = str(e.fields.pubtype).toLowerCase().trim();
  if (override === 'journal' || override === 'conference' || override === 'workshop') return override;
  switch (e.type.toLowerCase()) {
    case 'article':
      return 'journal';
    case 'inproceedings':
    case 'conference':
    case 'proceedings':
      return 'conference';
    default:
      return 'other';
  }
}

function venueOf(e: Entry) {
  const f = e.fields;
  return str(f.journal) || str(f.journaltitle) || str(f.booktitle) || str(f.howpublished) || str(f.publisher) || str(f.school) || str(f.institution);
}

function cleanDoi(v: unknown) {
  const s = str(v).trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return s || undefined;
}

/** Strip the website-only fields from the BibTeX users copy. */
function citeBibtex(input: string) {
  return input
    .replace(/^\s*(pdf|code|slides|pubtype)\s*=\s*(\{[^\n]*\}|"[^\n]*"|[^,\n]*),?\s*$\n?/gim, '')
    .replace(/,(\s*)\}\s*$/, '$1}')
    .trim();
}

let papers: Paper[] | undefined;

export function getPapers(): Paper[] {
  if (papers) return papers;
  ensureInit();
  const lib = parse(bibRaw, {
    english: [], // keep titles as written (no sentence-casing)
    verbatimFields: ['url', 'doi', 'pdf', 'code', 'slides'],
  });
  for (const err of lib.errors) console.warn(`[papers.bib] ${err.error}${err.input ? `: ${err.input.slice(0, 80)}` : ''}`);

  papers = lib.entries.map((e) => {
    const f = e.fields;
    const year = parseInt(str(f.year) || str(f.date).slice(0, 4), 10);
    const month = parseInt(str(f.month), 10);
    return {
      key: e.key,
      type: typeOf(e),
      title: safeInlineHtml(str(f.title)),
      authors: ((f.author as Name[] | undefined) ?? []).map(authorOf),
      venue: venueOf(e),
      year: Number.isFinite(year) ? year : null,
      month: Number.isFinite(month) ? month : null,
      doi: cleanDoi(f.doi),
      url: httpUrl(f.url),
      pdf: httpUrl(f.pdf),
      code: httpUrl(f.code),
      slides: httpUrl(f.slides),
      bibtex: citeBibtex(e.input),
    };
  });
  papers.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.month ?? 0) - (a.month ?? 0) || a.title.localeCompare(b.title));
  return papers;
}

export function papersByYear(list: Paper[]) {
  const groups = new Map<string, Paper[]>();
  for (const p of list) {
    const y = p.year ? String(p.year) : 'Undated';
    if (!groups.has(y)) groups.set(y, []);
    groups.get(y)!.push(p);
  }
  return [...groups.entries()];
}
