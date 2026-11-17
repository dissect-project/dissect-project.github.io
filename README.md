# DISSECT website

Source of [dissect-project.github.io](https://dissect-project.github.io), the website of **DISSECT** (Digital InfraStructure SECurity assessmenT).

Built with [Astro](https://astro.build) as a fully static site and deployed to GitHub Pages by GitHub Actions. No trackers, no analytics, no cookies, no third-party requests at runtime (fonts are self-hosted).

All content lives in data files. Updating the site never requires touching page code.

| What                       | Where                         |
| -------------------------- | ----------------------------- |
| Texts, contact, research areas, featured/excluded repos | `src/data/site.yaml` |
| Publications               | `src/data/papers.bib`         |
| Team members               | `src/content/team/*.md`       |
| Partners                   | `src/data/partners.yaml`      |
| Logos                      | `brand/` (used as-is)         |

## Run locally

Requires Node.js 22.23.4 or newer.

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
npm run check     # type-check
```

Set `GITHUB_TOKEN` (any token with public read access) to avoid the GitHub API rate limit while developing. It is optional.

## Add a team member

Create `src/content/team/firstname-lastname.md`:

```md
---
name: Jane Doe
role: PhD Student
photo: ../../assets/team/jane-doe.jpg   # optional; initials are shown otherwise
bibNames: ["Doe, Jane", "Doe, J."]      # optional; how the name appears in BibTeX
order: 10                                # lower numbers are listed first
alumni: false                            # true moves the person to "Alumni"
links:
  email: jane.doe@example.org
  orcid: https://orcid.org/0000-0000-0000-0000
  scholar: https://scholar.google.com/citations?user=XXXX
  github: https://github.com/janedoe
  linkedin: https://www.linkedin.com/in/janedoe
  website: https://janedoe.example.org
---
One or two sentences of bio. Markdown is allowed.
```

Put the photo (square works best, at least 256 px) in `src/assets/team/`. It is resized and optimised at build time. All links are optional; leave out the ones you don't use.

Authors in the publication list are highlighted when their first and last names match a member (`name`, or each entry in `bibNames`). Accents and middle names are ignored.

Delete `src/content/team/todo-member.md` once real members are added.

## Add a paper

Paste the BibTeX entry into `src/data/papers.bib`. Entries are sorted by year automatically. Getting BibTeX for a DOI:

```sh
curl -sL -H "Accept: application/x-bibtex" https://doi.org/10.xxxx/your-doi
```

Optional extra fields:

| Field     | Meaning                                                    |
| --------- | ---------------------------------------------------------- |
| `doi`     | DOI (shown as a doi.org link)                              |
| `pdf`     | URL of the PDF                                             |
| `code`    | URL of the code repository                                 |
| `slides`  | URL of the slides                                          |
| `pubtype` | `journal`, `conference` or `workshop`; overrides the type guessed from the entry (`@article` → journal, `@inproceedings` → conference). Use it to mark workshop papers. |

The **cite** button copies the entry as written, minus `pdf`, `code`, `slides` and `pubtype`.

## Add a partner

Put the logo in `src/assets/partners/` (SVG preferred) and add an entry to `src/data/partners.yaml`:

```yaml
partners:
  - name: Example Organisation
    url: https://example.org
    logo: example.svg
    description: One short line about the partnership.
```

The Partners section and its navigation link only appear when the list is not empty.

## Tools / repositories

Public repositories of the [`dissect-project`](https://github.com/dissect-project) organization are fetched from the GitHub API at build time. Forks, archived repos, `.github` and `dissect-project.github.io` are always hidden.

In `src/data/site.yaml`:

```yaml
repos:
  exclude:
    - new-website            # hide more repos by name
  featured:                  # shown first, in this order
    - name: cert-info
      description: A longer description shown on the card.
      paper: Ribeiro_2025    # optional: citation key from papers.bib
```

If the API call fails (offline, rate limit), the build uses `src/data/repos.cache.json`. Refresh it now and then and commit the result:

```sh
npm run refresh-repos
```

The deploy workflow also rebuilds the site every Monday so stars and dates stay current.

## Logos and icons

The files in `brand/` are the official logos and must not be edited. Favicons and the social preview image in `public/` are generated from `brand/3-icon/`:

```sh
npm run gen-icons
```

## Deployment

`.github/workflows/deploy.yml` builds and deploys on every push to `master`, weekly, and on manual dispatch (Actions → Deploy to GitHub Pages → Run workflow).

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Security notes

- A Content-Security-Policy `<meta>` tag allows only same-origin scripts, styles, fonts and images. There are no inline scripts or styles. GitHub Pages cannot set HTTP headers, so `frame-ancestors` and HSTS are out of our hands (GitHub Pages enforces HTTPS itself).
- The only scripts are `public/site.js` (theme and menu) and a small bundled module for the publication filters and cite button. The site works without JavaScript.
- BibTeX titles are rendered as HTML only after escaping; `<i>`, `<b>`, `<em>`, `<strong>`, `<sup>` and `<sub>` are the only tags kept.

## License

Code: [MIT](LICENSE). The logos in `brand/` are DISSECT's visual identity and are not covered by the MIT license.
