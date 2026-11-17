// Progressive enhancement for publication lists:
//  - "cite" buttons copy the entry's BibTeX (the <details> fallback works without JS)
//  - type filter chips on /publications

function initCite() {
  if (!navigator.clipboard) return;
  document.querySelectorAll<HTMLButtonElement>('[data-cite]').forEach((btn) => {
    btn.hidden = false;
    btn.addEventListener('click', async () => {
      const code = btn.closest('.pub')?.querySelector('pre code');
      if (!code?.textContent) return;
      const label = btn.querySelector('.cite-label');
      try {
        await navigator.clipboard.writeText(code.textContent);
        btn.classList.add('copied');
        if (label) label.textContent = 'copied';
      } catch {
        if (label) label.textContent = 'copy failed';
      }
      announce(label?.textContent === 'copied' ? 'BibTeX copied to clipboard' : 'Could not copy BibTeX');
      window.setTimeout(() => {
        btn.classList.remove('copied');
        if (label) label.textContent = 'cite';
      }, 2000);
    });
  });
}

function announce(msg: string) {
  const live = document.getElementById('live-region');
  if (!live) return;
  live.textContent = '';
  window.setTimeout(() => (live.textContent = msg), 50);
}

function initFilters() {
  const bar = document.querySelector<HTMLElement>('[data-filters]');
  if (!bar) return;
  bar.hidden = false;
  const chips = [...bar.querySelectorAll<HTMLButtonElement>('button[data-filter]')];
  const pubs = [...document.querySelectorAll<HTMLElement>('.pub[data-type]')];
  const groups = [...document.querySelectorAll<HTMLElement>('[data-year-group]')];

  const apply = (filter: string) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === filter)));
    let shown = 0;
    pubs.forEach((p) => {
      const on = filter === 'all' || p.dataset.type === filter;
      p.hidden = !on;
      if (on) shown++;
    });
    groups.forEach((g) => (g.hidden = !g.querySelector('.pub:not([hidden])')));
    announce(`${shown} publication${shown === 1 ? '' : 's'} shown`);
  };

  chips.forEach((c) => c.addEventListener('click', () => apply(c.dataset.filter ?? 'all')));
}

initCite();
initFilters();
