import { getCollection, type CollectionEntry } from 'astro:content';

export type Member = CollectionEntry<'team'>;

const byOrder = (a: Member, b: Member) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name);

export async function getTeam() {
  const all = (await getCollection('team')).sort(byOrder);
  return {
    current: all.filter((m) => !m.data.alumni),
    alumni: all.filter((m) => m.data.alumni),
    all,
  };
}

export function initials(name: string) {
  if (/^\s*TODO\b/i.test(name)) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Normalise a person's name for matching: lowercase, no accents, no punctuation. */
export function normName(s: string) {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "first-token last-token" so "Diogo P. Ribeiro" and "Ribeiro, Diogo" match. */
export function nameKey(first: string, last: string) {
  const f = normName(first).split(' ')[0] ?? '';
  const l = normName(last).split(' ').pop() ?? '';
  return `${f} ${l}`.trim();
}

/** Keys "first last" for each member, from `bibNames` (Last, First) or `name`. */
export function memberNameKeys(members: Member[]) {
  const keys = new Set<string>();
  for (const m of members) {
    const names = m.data.bibNames?.length ? m.data.bibNames : [m.data.name];
    for (const n of names) {
      if (/^TODO/i.test(n)) continue;
      if (n.includes(',')) {
        const [last, first] = n.split(',', 2);
        keys.add(nameKey(first, last));
      } else {
        const parts = n.trim().split(/\s+/);
        keys.add(nameKey(parts[0], parts[parts.length - 1]));
      }
    }
  }
  return keys;
}
