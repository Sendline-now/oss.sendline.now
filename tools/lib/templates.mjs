import { hub, libraries, runtimes, site } from '../../site.config.mjs';
import { esc, highlight } from './docs.mjs';
import { marks, patch, rim, sendline } from './marks.mjs';

const wordmark = (id) => id.replace(/4s$/, '<b>4s</b>');
const pageUrl = (lib, slug) => `/${lib.id}/${slug ? `${slug}/` : ''}`;

// ---------- marks ----------

// The symbols take --m-patch, --m-ink and --m-rim from the element that uses them and fall back to the colours in
// brand/, so a mark with no overrides is the same mark the libraries' READMEs show.
const paths = (list) => list.map((d) => `<path d="${d}"/>`).join('');

const symbols = () => {
  const stroke = (ink, width) =>
    `fill:none;stroke:var(--m-ink,${ink});stroke-width:${width};stroke-linecap:round;stroke-linejoin:round`;
  const library = Object.entries(marks).map(([id, mark]) => `
    <symbol id="m-${id}" viewBox="0 0 120 120"><path style="fill:var(--m-patch,${mark.colour})" d="${patch}"/><path style="fill:none;stroke:var(--m-ink,${mark.ink});stroke-width:4;opacity:var(--m-rim,.85)" d="${rim}"/><g style="${stroke(mark.ink, 10)}">${paths(mark.glyph)}</g></symbol>
    <symbol id="m-${id}-small" viewBox="0 0 120 120"><path style="fill:var(--m-patch,${mark.colour})" d="${patch}"/><g style="${stroke(mark.ink, mark.smallStroke)}">${paths(mark.small)}</g></symbol>`);
  const [cx, cy, r] = sendline.start;

  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="m-sendline" viewBox="0 0 120 120"><path style="fill:var(--house)" d="${patch}"/><path style="fill:none;stroke:#fff;stroke-width:4;opacity:.85" d="${rim}"/><path style="fill:none;stroke:#fff;stroke-width:10;stroke-linecap:round;stroke-linejoin:round" d="${sendline.route}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/><path fill="#fff" d="${sendline.arrow}"/></symbol>${library.join('')}
    <symbol id="i-github" viewBox="0 0 16 16"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></symbol>
    <symbol id="i-theme" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/></g></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></g></symbol>
  </defs>
</svg>`;
};

const mark = (id, { small = false, size = null, style = '', className = 'mark' } = {}) =>
  `<svg class="${className}"${size ? ` width="${size}" height="${size}"` : ''}${style ? ` style="${style}"` : ''} aria-hidden="true"><use href="#m-${id}${small ? '-small' : ''}"/></svg>`;

// ---------- frame ----------

const head = ({ title, description, path, lib, assets, extra = '' }) => `<!DOCTYPE html>
<html lang="en"${lib ? ` data-lib="${lib.id}"` : ''}>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}"/>
  <link rel="canonical" href="${site.url}${path}"/>
  <meta name="theme-color" content="#0c0d0f"/>
  <link rel="icon" href="/brand/${lib ? lib.id : 'sendline'}-favicon.svg" type="image/svg+xml"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="${esc(site.title)}"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(description)}"/>
  <meta property="og:url" content="${site.url}${path}"/>${lib ? `
  <meta property="og:image" content="${site.url}/brand/${lib.id}-social.png"/>
  <meta property="og:image:width" content="1280"/>
  <meta property="og:image:height" content="640"/>
  <meta name="twitter:card" content="summary_large_image"/>` : ''}
  <script>try { const t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t } catch {}</script>${extra}
  <link rel="preload" href="/assets/fonts/roboto-flex-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin/>
  <link rel="stylesheet" href="/assets/site.css?v=${assets.css}"/>
</head>`;

const topbar = (lib) => `
<header class="topbar">
  <div class="topbar-inner">${lib ? `
    <button class="icon-btn menu-btn" type="button" data-nav-toggle aria-label="Open navigation" aria-expanded="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>` : ''}
    <a class="brand" href="/">
      <svg class="mark" width="26" height="26" aria-hidden="true"><use href="#m-sendline"/></svg>
      <span class="brand-name">SENDLINE</span>
      <span class="brand-sub">open source</span>
    </a>
    <nav class="libs" aria-label="Libraries">
      ${libraries.map((l) => `<a href="/${l.id}/"${l.id === lib?.id ? ' aria-current="page"' : ''} style="--fill:var(--${l.id})">${mark(l.id, { small: true, size: 16 })}${l.id}</a>`).join('\n      ')}
    </nav>
    <div class="topbar-tools">
      <button class="search" type="button" data-search-open><svg width="16" height="16" aria-hidden="true"><use href="#i-search"/></svg><span>Search ${lib ? lib.id : 'all docs'}</span><kbd>/</kbd></button>
      <a class="icon-btn" href="https://github.com/${lib ? lib.repo : site.org}" aria-label="${lib ? lib.id : 'Sendline'} on GitHub"><svg aria-hidden="true"><use href="#i-github"/></svg></a>
      <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch light or dark theme"><svg aria-hidden="true"><use href="#i-theme"/></svg></button>
    </div>
  </div>
</header>`;

const searchDialog = (lib) => `
<dialog class="search-dialog" data-search${lib ? ` data-lib="${lib.id}"` : ''} aria-label="Search">
  <form class="search-box" method="dialog" data-search-form>
    <svg width="18" height="18" aria-hidden="true"><use href="#i-search"/></svg>
    <input type="search" placeholder="Search ${lib ? lib.id : 'all libraries'}" aria-label="Search" autocomplete="off" spellcheck="false" data-search-input/>${lib ? `
    <label class="search-scope"><input type="checkbox" data-search-all/> all libraries</label>` : ''}
    <button class="search-close" type="button" data-search-close aria-label="Close search">Esc</button>
  </form>
  <ol class="search-results" data-search-results></ol>
  <p class="search-status" data-search-status aria-live="polite"></p>
</dialog>`;

const footer = (lib, facts) => `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <a class="brand" href="/"><svg class="mark" width="26" height="26" aria-hidden="true"><use href="#m-sendline"/></svg><span class="brand-name">SENDLINE</span></a>
      <p>Effect-agnostic Scala 3 libraries, published under the Apache License 2.0.</p>
    </div>
    <div>
      <h4>Libraries</h4>
      <ul>${libraries.map((l) => `<li><a href="/${l.id}/">${l.id}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h4>Project</h4>
      <ul><li><a href="https://github.com/${site.org}">GitHub</a></li><li><a href="https://central.sonatype.com/namespace/now.sendline">Maven Central</a></li>${lib ? `<li><a href="https://github.com/${lib.repo}/security/policy">Security policy</a></li>` : ''}</ul>
    </div>
    <div>
      <h4>Sendline</h4>
      <ul><li><a href="https://sendline.now">sendline.now ↗</a></li></ul>
    </div>
    <div class="footer-legal">
      <span>© Sendline · code under Apache 2.0</span>
      <span class="mono">${facts ? `built from ${esc(lib.repo)} at ${esc(facts.builtFrom)}` : 'built from each library’s docs on GitHub'}</span>
    </div>
  </div>
</footer>`;

const tail = (lib, assets) => `${searchDialog(lib)}
<script src="/assets/site.js?v=${assets.js}" defer></script>
</body>
</html>
`;

// ---------- library pages ----------

const navLink = (href, label, { current = false, external = false } = {}) =>
  `<li><a${external ? ' class="ext"' : ''} href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;

const sidebar = (lib, facts, current) => {
  const extra = {
    Reference: [navLink(`https://javadoc.io/doc/${facts.organization}/${lib.javadoc}/${facts.version}`, 'API docs', { external: true })],
    Project: [
      navLink(`https://github.com/${lib.repo}`, 'GitHub', { external: true }),
      navLink(`https://central.sonatype.com/search?q=g:${facts.organization}%20${lib.id}`, 'Maven Central', { external: true }),
    ],
  };
  const groups = lib.groups.map((group) => `
    <div class="nav-group">
      <h4>${group.title}</h4>
      <ul>
        ${[
          ...(group.title === 'Project' ? extra.Project : []),
          ...group.pages.map((page) => navLink(pageUrl(lib, page.slug), esc(page.label), { current: page === current })),
          ...(group.title === 'Reference' ? extra.Reference : []),
        ].join('\n        ')}
      </ul>
    </div>`);

  return `
  <aside class="sidebar" aria-label="${lib.id} documentation">
    <nav class="mobile-libs" aria-label="Libraries">
      ${libraries.map((l) => `<a href="/${l.id}/"${l.id === lib.id ? ' aria-current="page"' : ''}>${mark(l.id, { small: true })}${l.id}</a>`).join('\n      ')}
    </nav>

    <a class="side-lib" href="/${lib.id}/">
      ${mark(lib.id)}
      <span class="wordmark">${wordmark(lib.id)}</span>
    </a>

    <div class="version"><span>v${esc(facts.version)}</span><span class="tag">latest</span></div>
${groups.join('')}
  </aside>`;
};

const installCode = (lib, facts, runtime) => {
  const modules = [lib.install.runtime.replace('{rt}', runtime.id), ...lib.install.modules];
  const coords = modules.map((module) => `"${facts.organization}" %% "${module}"`);
  const width = Math.max(...coords.map((coord) => coord.length));
  const deps =
    modules.length === 1
      ? `libraryDependencies += ${coords[0]} % "${facts.version}"`
      : `libraryDependencies ++= Seq(\n${coords.map((coord) => `  ${coord.padEnd(width)} % "${facts.version}",`).join('\n')}\n)`;
  return `${deps}\n\nimport ${lib.install.import.replace('{rt}', runtime.id)}.${runtime.object}.given`;
};

const runtimeTabs = (panels, className = '') => `
<div class="code${className}" data-pagefind-ignore>
  <div class="code-head">
    <div class="tabs" role="tablist" aria-label="Runtime">
      ${runtimes.map((runtime) => `<button role="tab" type="button" data-runtime-tab="${runtime.id}">${runtime.label}</button>`).join('\n      ')}
    </div>
    <button class="copy" type="button">Copy</button>
  </div>
  ${runtimes.map((runtime, i) => `<div data-runtime-panel="${runtime.id}"${i ? ' hidden' : ''}>${highlight(panels(runtime), 'scala')}</div>`).join('\n  ')}
</div>`;

const heading = (id, text) => `<h2 id="${id}">${text} <a class="anchor" href="#${id}" aria-label="Link to this section"></a></h2>`;

const jdk = (lib) => `${lib.jdk.base}+`;
const jdkNotes = (lib) => lib.jdk.notes.map(([module, version]) => `${module} ${version}`).join(' · ');

const overviewHead = (lib, facts, overview) => `
    <section class="plate" aria-label="${lib.id}">
      <div class="plate-top"><span>No. ${lib.no}</span><span>${esc(facts.organization)} · Apache-2.0</span></div>
      <h1 class="wordmark">${wordmark(lib.id)}</h1>
      <div class="plate-what">${esc(lib.what)}</div>
      ${mark(lib.id)}
    </section>

    ${overview.tagline ? `<p class="tagline">${overview.tagline}</p>` : ''}

    <ul class="chips lib-meta">
      <li class="chip">latest <strong>${esc(facts.version)}</strong></li>
      <li class="chip">Scala <strong>${esc(facts.scala)}</strong></li>
      <li class="chip">JDK <strong>${jdk(lib)}</strong></li>
      ${lib.chips(facts.all).map(([label, value]) => `<li class="chip">${esc(label)} <strong>${esc(value)}</strong></li>`).join('\n      ')}
    </ul>

    ${heading('install', 'Install')}
    ${runtimeTabs((runtime) => installCode(lib, facts, runtime), ' install')}
    <p class="install-note">The runtime you pick here is remembered on every page and in every library. ${lib.installNote}</p>
${overview.glance ? `\n    ${heading('at-a-glance', 'At a glance')}\n    <div class="prose">\n${overview.glance}    </div>` : ''}`;

const whereNext = (lib, pages) => `
    ${heading('where-next', 'Where next')}
    <div class="next-cards">
      ${lib.next.map((slug) => pages.find((page) => page.slug === slug)).map((page) => `<a class="next-card" href="${pageUrl(lib, page.slug)}"><b>${esc(page.label)}</b><span>${esc(page.blurb ?? '')}</span></a>`).join('\n      ')}
    </div>`;

const pager = (lib, prev, next) => !prev && !next ? '' : `
    <nav class="pager" aria-label="Pages">
      ${prev ? `<a class="prev" href="${pageUrl(lib, prev.slug)}"><small>Previous</small><b>← ${esc(prev.label)}</b></a>` : ''}
      ${next ? `<a class="next" href="${pageUrl(lib, next.slug)}"><small>Next</small><b>${esc(next.label)} →</b></a>` : ''}
    </nav>`;

export const libraryPage = ({ lib, facts, page, pages, html, toc, overview, assets, legacy, mermaid }) => {
  const index = pages.indexOf(page);
  const path = pageUrl(lib, page.slug);
  const title = page.slug ? `${page.label} · ${lib.id}` : `${lib.id} — ${lib.what}`;
  const redirect = legacy && Object.keys(legacy).length
    ? `\n  <script>(() => { const to = ${JSON.stringify(legacy)}[decodeURIComponent(location.hash.slice(1))]; if (to) location.replace(to) })()</script>`
    : '';
  const fullToc = overview
    ? [{ id: 'install', text: 'Install' }, ...(overview.glance ? [{ id: 'at-a-glance', text: 'At a glance' }] : []), ...toc, { id: 'where-next', text: 'Where next' }]
    : toc;

  return `${head({ title: `${title} · ${site.title}`, description: page.slug ? `${page.label} — ${lib.description}` : lib.description, path, lib, assets, extra: redirect })}
<body${mermaid ? ' data-mermaid' : ''}>
${symbols()}
${topbar(lib)}

<div class="shell">
${sidebar(lib, facts, page)}

  <main class="content" data-pagefind-body data-pagefind-filter="lib:${lib.id}" data-pagefind-meta="title:${esc(page.slug ? `${lib.id} · ${page.label}` : lib.id)}">

    <div class="crumbs"><a href="/">open source</a> / <a href="/${lib.id}/">${lib.id}</a> / ${esc(page.label.toLowerCase())}</div>
${overview ? overviewHead(lib, facts, overview) : `
    <h1 class="doc-title" id="${esc(page.topId ?? 'top')}">${page.titleHtml}</h1>`}

    <div class="prose">
${html}
    </div>
${overview ? whereNext(lib, pages) : ''}
${pager(lib, pages[index - 1], pages[index + 1])}

    <div class="page-foot" data-pagefind-ignore>
      <span>built from ${esc(page.file)} at ${esc(facts.builtFrom)}</span>
      <a href="https://github.com/${lib.repo}/edit/main/${page.file}">edit this page on GitHub</a>
    </div>

  </main>

  <aside class="toc" aria-label="On this page">${fullToc.length ? `
    <h4>On this page</h4>
    <ul>
      ${fullToc.map((entry) => `<li><a href="#${esc(entry.id)}">${esc(entry.text)}</a></li>`).join('\n      ')}
    </ul>` : ''}
    <div class="toc-extra">
      <a href="https://github.com/${lib.repo}">GitHub ↗</a>
      ${pages.some((p) => p.slug === 'changelog') ? `<a href="/${lib.id}/changelog/">Changelog</a>` : ''}
      <a href="https://github.com/${lib.repo}/issues">Report an issue ↗</a>
    </div>
  </aside>

</div>
${footer(lib, facts)}
${tail(lib, assets)}`;
};

// ---------- hub ----------

const lane = (lib, facts) => `
    <article class="lane" style="--fill:var(--${lib.id});--fill-ink:var(--${lib.id}-ink)">
      <div class="lane-plate">
        <span class="no">${lib.no} · ${esc(facts.organization)}</span>
        ${mark(lib.id, { style: '--m-patch:var(--fill-ink);--m-ink:var(--fill);--m-rim:.6' })}
        <div class="wordmark">${lib.id}</div>
        <div class="what">${esc(lib.what)}</div>
      </div>
      <div class="lane-body">
        <p>${lib.lane.text}</p>
        <ul class="chips">
          <li class="chip"><strong>${esc(facts.version)}</strong></li>
          ${lib.lane.chips(facts.all).map((chip) => `<li class="chip">${esc(chip)}</li>`).join('\n          ')}
        </ul>
        <div class="runtimes">${runtimes.map((runtime) => `<span>${runtime.label}</span>`).join('')}</div>
        <p class="lane-install"><span class="s">"${esc(facts.organization)}"</span> %% <span class="s">"${lib.install.runtime.replace('{rt}', 'cats')}"</span> % <span class="s">"${esc(facts.version)}"</span></p>
        <div class="lane-links"><a class="go" href="/${lib.id}/">Docs →</a><a href="https://github.com/${lib.repo}">GitHub</a><a href="/${lib.id}/${lib.lane.third.slug}/">${lib.lane.third.title}</a></div>
      </div>
    </article>`;

const runtimeCode = (all) => (runtime) => {
  const coords = all.map(({ lib, facts }) => `"${facts.organization}" %% "${lib.install.runtime.replace('{rt}', runtime.id)}"`);
  const width = Math.max(...coords.map((coord) => coord.length));
  const jdkNote = all.flatMap(({ lib }) => lib.jdk.notes).filter(([module]) => module === runtime.id).map(([, version]) => version);
  const comment = jdkNote.length ? `// build.sbt — the ${runtime.id} modules need JDK ${[...new Set(jdkNote)].join(' or ')}` : '// build.sbt';

  return `${comment}
${all.map(({ facts }, i) => `${coords[i].padEnd(width)} % "${facts.version}",`).join('\n')}

// one import per library, and nothing else changes
${all.map(({ lib }) => `import ${lib.install.import.replace('{rt}', runtime.id)}.${runtime.object}.given`).join('\n')}`;
};

const matrix = (all) => `
    <div class="matrix-wrap">
      <table>
        <thead>
        <tr><th>Library</th><th>Latest</th><th>Scala</th><th>JDK</th>${runtimes.map((runtime) => `<th>${runtime.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
        ${all.map(({ lib, facts }) => `<tr>
          <td><a class="lib" href="/${lib.id}/">${mark(lib.id, { small: true })}${lib.id}</a></td>
          <td class="mono">${esc(facts.version)}</td>
          <td class="mono">${esc(facts.scala)}</td>
          <td>${jdk(lib)} <span class="note">· ${esc(jdkNotes(lib))}</span></td>
          ${runtimes.map((runtime) => `<td class="mono">${esc(facts.runtimes[runtime.id])}</td>`).join('')}
        </tr>`).join('\n        ')}
        </tbody>
      </table>
    </div>`;

export const hubPage = ({ all, assets }) => `${head({ title: `${site.title} — Scala 3 libraries`, description: site.description, path: '/', assets })}
<body>
${symbols()}
${topbar(null)}

<main class="hub" data-pagefind-body data-pagefind-filter="lib:hub" data-pagefind-meta="title:Sendline Open Source">

  <section class="hub-hero">
    <span class="eyebrow">oss.sendline.now</span>
    <h1>Open source <em>from Sendline</em></h1>
    <p class="lead">${hub.lead}</p>
  </section>

  <section class="gate" id="libraries" aria-label="Libraries">
${all.map(({ lib, facts }) => lane(lib, facts)).join('\n')}
  </section>

  <section class="band" id="shape">
    <div class="band-head">
      <div>
        <span class="eyebrow">One shape, three libraries</span>
        <h2>Pick a runtime once</h2>
      </div>
      <p>Each library is a core plus thin modules around it. The runtime is one of those modules and one import, and it
        is the same four runtimes, wired the same way, in all three.</p>
    </div>

    <div class="principles">
      <div class="principle-list">
        ${hub.principles.map(([title, text]) => `<div class="principle"><h3>${title}</h3><p>${text}</p></div>`).join('\n        ')}
      </div>
      ${runtimeTabs(runtimeCode(all))}
    </div>
  </section>

  <section class="band" id="compatibility">
    <div class="band-head">
      <div>
        <span class="eyebrow">Compatibility</span>
        <h2>What they run on</h2>
      </div>
      <p>Read from each library’s own build, so this table moves when a release does.</p>
    </div>
${matrix(all)}
  </section>

  <section class="band" id="together">
    <div class="together">
      <div>
        <div class="together-pair">
          ${mark('metrics4s')}
          <span class="plus">+</span>
          ${mark('mongo4s')}
        </div>
        <span class="eyebrow">Better together</span>
        <h2 style="margin-top:.5rem">${esc(hub.together.title)}</h2>
        <p class="dim">${hub.together.text}</p>
        <p class="dim">${hub.together.series.map((series) => `<code>${esc(series)}</code>`).join(', ')}</p>
        <p><a href="/metrics4s/integrations/">metrics4s integrations →</a></p>
      </div>
      <div class="code">
        <div class="code-head" data-pagefind-ignore><span class="code-lang">scala</span><button class="copy" type="button">Copy</button></div>
        ${highlight(hub.together.code, 'scala')}
      </div>
    </div>
  </section>

</main>
${footer(null, null)}
${tail(null, assets)}`;

export const notFoundPage = ({ assets }) => `${head({ title: `Not found · ${site.title}`, description: site.description, path: '/404.html', assets, extra: '\n  <meta name="robots" content="noindex"/>' })}
<body>
${symbols()}
${topbar(null)}

<main class="hub">
  <section class="hub-hero">
    <span class="eyebrow">404</span>
    <h1>No page <em>here</em></h1>
    <p class="lead">The address may be from before a library moved to oss.sendline.now. Each library’s docs start at its
      own page:</p>
  </section>
  <section class="gate-mini">
    ${libraries.map((lib) => `<a class="next-card" href="/${lib.id}/" style="--section:var(--${lib.id})"><b>${lib.id}</b><span>${esc(lib.what)}</span></a>`).join('\n    ')}
  </section>
</main>
${footer(null, null)}
${tail(null, assets)}`;
