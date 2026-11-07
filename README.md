# oss.sendline.now

The site for Sendline's open-source Scala 3 libraries: [mongo4s](https://github.com/Sendline-now/mongo4s),
[logging4s](https://github.com/Sendline-now/logging4s) and [metrics4s](https://github.com/Sendline-now/metrics4s). It is a
static site on GitHub Pages, built by a small Node generator from each library's own markdown at its release tag.
Nothing about a library is written here twice: its pages are its README and docs, and the versions, Scala and runtime
numbers come from its build.

## Layout

| Path                        | What it is                                                                                 |
|-----------------------------|--------------------------------------------------------------------------------------------|
| `site.config.mjs`           | the libraries, the tag each one is built from, how its docs split into pages, the hub copy |
| `tools/build.mjs`           | the build: plan pages, resolve links, render, search index, link check                     |
| `tools/lib/docs.mjs`        | markdown: GitHub heading ids, sections, Shiki highlighting, mermaid blocks                 |
| `tools/lib/sources.mjs`     | where the docs are read from, and the facts read from each `build.sbt`                     |
| `tools/lib/templates.mjs`   | the hub, the library pages and the 404                                                     |
| `tools/check.mjs`           | every internal link and anchor in `site/` has to resolve                                   |
| `tools/fetch-sources.mjs`   | shallow clones of each library at its tag, into `sources/`                                 |
| `theme/`                    | the stylesheet, the script and the self-hosted fonts                                       |
| `brand/`, `tools/brand.mjs` | the library marks, generated; `brand/index.html` is the review sheet                       |

## Building

```bash
npm ci
npm run fetch      # each library at its tag, into sources/
npm run build      # site/, with search index and link check
npm run serve      # http://localhost:4173, served the way Pages serves it
```

To preview docs that are not tagged yet, point the build at working copies instead of `sources/`:

```bash
OSS_SOURCES=/path/to/folder-with-the-three-repos npm run build
```

The build fails on anything that would publish a broken page: a section named in `site.config.mjs` that a README no
longer has, a link to a heading that does not exist, an image missing from the repository, an old anchor in `legacy`
that points nowhere, or a tag whose `build.sbt` says a different version.

## How a library's docs become pages

- **Pages.** `site.config.mjs` names, per library, which document or which H2 sections of the README make each page.
  A section on a page of its own becomes the page title, and its headings move up one level.
- **Anchors.** Heading ids are GitHub's, counted over the whole file, so `README.md#filters` on GitHub and
  `/mongo4s/core-concepts/#filters` here name the same heading. Links between a library's documents, and links to
  the libraries' repositories on GitHub, resolve to the page that has the target; links to anything else in the
  repository go to GitHub at the tag.
- **Old addresses.** mongo4s.org and logging4s.org redirect to `/mongo4s/` and `/logging4s/`, keeping the
  fragment. The overview page sends an anchor of the old single-page site (`legacy` in the config), or any README
  anchor that now lives on another page, on to where it is.
- **The overview.** The README's first paragraph is the tagline; its badges become the chips under the title and its
  list of section links becomes the sidebar. The rest of the intro is "At a glance".
- **Search.** [Pagefind](https://pagefind.app), indexed at build time, filtered to the current library by default.
- **Diagrams.** mermaid blocks render in the browser, loaded only on pages that have one, in the theme's colours.

## Releasing a library's docs

Tag the library, then bump its `tag` in `site.config.mjs`. The push to `main` rebuilds and deploys the site. A docs fix
that should go out without a release needs a new tag too: the site only shows what a tag holds.

## Deployment

`.github/workflows/pages.yml` builds on every push and pull request and deploys `main` to GitHub Pages. The repository's
Pages source is **GitHub Actions** and its custom domain is `oss.sendline.now`, with a `CNAME` record for `oss` pointing
at `sendline-now.github.io`.

## Brand

`npm run brand` regenerates `brand/` from `tools/lib/marks.mjs`: each library's lockup, mark, wordmark, favicon, PNGs and
social card. The libraries' repositories carry copies of these files, so a change here is a change to send them.
