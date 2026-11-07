import { createHash } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';

import * as pagefind from 'pagefind';

import { libraries, site } from '../site.config.mjs';
import { check } from './check.mjs';
import { headingsOf, idsOf, parseDocument, promote, render, renderInline, splitIntro } from './lib/docs.mjs';
import { local, readFacts, sourceDir } from './lib/sources.mjs';
import { hubPage, libraryPage, notFoundPage } from './lib/templates.mjs';

const out = 'site';
const problems = [];

const write = async (path, content) => {
  await mkdir(dirname(join(out, path)), { recursive: true });
  await writeFile(join(out, path), content);
};

// ---------- plan: every page of every library, and where each heading ended up ----------

const plans = new Map();

for (const lib of libraries) {
  const dir = sourceDir(lib);
  const facts = await readFacts(lib);
  if (!local && facts.ref !== lib.tag) problems.push(`${lib.id}: build.sbt says ${facts.version} at tag ${lib.tag}`);

  const docs = new Map();
  const doc = async (file) => {
    if (!docs.has(file)) docs.set(file, parseDocument(await readFile(join(dir, file), 'utf8')));
    return docs.get(file);
  };

  const pages = lib.groups.flatMap((group) => group.pages);
  const locations = new Map();
  const files = new Set();

  for (const page of pages) {
    const d = await doc(page.file);
    files.add(page.file);
    const section = (title) => {
      const found = d.sections.find((s) => s.title === title);
      if (!found) throw new Error(`${lib.id}: ${page.file} has no section "${title}"; its sections are ${d.sections.map((s) => s.title).join(', ')}`);
      return found;
    };

    if (page.sections) {
      const intro = page.sections.includes('') ? splitIntro(d.intro) : null;
      const parts = page.sections.filter(Boolean).map(section);
      Object.assign(page, {
        label: page.title,
        intro,
        tokens: parts.flatMap((s) => [...s.heading, ...s.tokens]),
        ids: [...(intro ? idsOf(intro.tokens) : []), ...parts.map((s) => s.id), ...parts.flatMap((s) => idsOf(s.tokens))],
      });
    } else if (page.section) {
      const s = section(page.section);
      Object.assign(page, { label: page.title ?? s.title, titleHtml: s.titleHtml, topId: s.id, tokens: promote(s.tokens), ids: idsOf(s.tokens) });
    } else {
      const tokens = [...d.intro, ...d.sections.flatMap((s) => [...s.heading, ...s.tokens])];
      Object.assign(page, { label: page.title ?? d.title, titleHtml: d.titleHtml, topId: d.id, tokens, ids: idsOf(tokens) });
      locations.set(page.file, { slug: page.slug, id: null });
    }

    page.titleHtml ??= page.label;
    if (page.topId) locations.set(`${page.file}#${page.topId}`, { slug: page.slug, id: null });
    for (const id of page.ids) locations.set(`${page.file}#${id}`, { slug: page.slug, id });
  }

  if (!locations.has('README.md')) locations.set('README.md', { slug: '', id: null });
  plans.set(lib.id, { lib, dir, facts, docs, pages, locations, files, assets: new Set() });
}

// ---------- links: a link in a library's markdown, resolved to wherever its target is published ----------

const resolver = (plan, file, slug) => {
  const link = (target, path, id) => {
    const at = target.locations.get(id ? `${path}#${id}` : path);
    if (at) {
      if (target === plan && at.slug === slug && at.id) return `#${at.id}`;
      return `/${target.lib.id}/${at.slug ? `${at.slug}/` : ''}${at.id ? `#${at.id}` : ''}`;
    }
    const alias = path === 'README.md' && id && target.lib.aliases[id];
    return alias ? resolver(target, 'README.md', null)(alias) : null;
  };

  return (href, { asset = false } = {}) => {
    if (!href || /^(mailto|tel|data):/i.test(href)) return href;

    // A link to one of the libraries' own repositories or READMEs on GitHub lands on its page here instead.
    const github = href.match(/^https?:\/\/github\.com\/sendline-now\/([\w.-]+?)(?:\/blob\/[^/#?]+\/([^#?]+))?\/?(?:#(.*))?$/i);
    if (github && plans.has(github[1].toLowerCase())) {
      return link(plans.get(github[1].toLowerCase()), github[2] ?? 'README.md', github[3] ? decodeURIComponent(github[3]) : null) ?? href;
    }
    if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) return href;

    const hashAt = href.indexOf('#');
    const pathPart = hashAt < 0 ? href : href.slice(0, hashAt);
    const hash = hashAt < 0 ? null : href.slice(hashAt + 1);
    const id = hash ? decodeURIComponent(hash) : null;

    if (!pathPart) {
      const resolved = link(plan, file, id);
      if (!resolved) problems.push(`${plan.lib.id}/${file}: no heading #${id}`);
      return resolved ?? href;
    }

    const path = posix.normalize(posix.join(posix.dirname(file), decodeURI(pathPart))).replace(/^\.\//, '');
    if (asset) {
      plan.assets.add(path);
      return `/${plan.lib.id}/media/${encodeURI(path)}`;
    }
    if (plan.files.has(path)) {
      const resolved = link(plan, path, id);
      if (!resolved) problems.push(`${plan.lib.id}/${file}: ${path} has no heading #${id}`);
      return resolved ?? href;
    }

    const full = join(plan.dir, path);
    if (!existsSync(full)) problems.push(`${plan.lib.id}/${file}: links to ${path}, which is not in the repository`);
    const kind = existsSync(full) && statSync(full).isDirectory() ? 'tree' : 'blob';
    return `https://github.com/${plan.lib.repo}/${kind}/${plan.facts.ref}/${path}${hash ? `#${hash}` : ''}`;
  };
};

// The old single-page sites and GitHub-style README anchors both arrive at /<id>/#anchor. Anything that is not on the
// overview is sent on to the page that has it.
const legacyMap = (plan, overview) => {
  const here = new Set(overview.ids);
  const map = {};
  const readme = plan.docs.get('README.md');
  const ids = readme ? [...readme.sections.map((s) => s.id), ...readme.sections.flatMap((s) => idsOf(s.tokens))] : [];
  const fromOverview = resolver(plan, 'README.md', '');

  for (const id of ids) {
    if (here.has(id)) continue;
    const to = fromOverview(`#${id}`);
    if (to && !to.startsWith('#')) map[id] = to;
  }

  for (const [old, target] of Object.entries(plan.lib.legacy)) {
    const [slug, id] = target.split('#');
    const page = plan.pages.find((p) => `${p.slug ? `${p.slug}/` : ''}` === slug);
    const known = page && (!id || page.ids.includes(id) || page.topId === id || (page === overview && ['install', 'at-a-glance'].includes(id)));
    if (!known) problems.push(`${plan.lib.id}: legacy #${old} points at ${target}, which does not exist`);
    if (here.has(old)) continue;
    map[old] = `/${plan.lib.id}/${target}`;
  }

  return map;
};

// ---------- write ----------

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await cp('theme', join(out, 'assets'), { recursive: true });
await mkdir(join(out, 'assets/vendor'), { recursive: true });
await copyFile('node_modules/mermaid/dist/mermaid.min.js', join(out, 'assets/vendor/mermaid.min.js'));

const hash = async (path) => createHash('sha256').update(await readFile(path)).digest('hex').slice(0, 10);
const assets = { css: await hash('theme/site.css'), js: await hash('theme/site.js') };

await mkdir(join(out, 'brand'), { recursive: true });
await copyFile('brand/sendline-favicon.svg', join(out, 'brand/sendline-favicon.svg'));
await copyFile('brand/sendline-mark.svg', join(out, 'brand/sendline-mark.svg'));

const urls = ['/'];

for (const plan of plans.values()) {
  const { lib, facts, pages } = plan;
  for (const file of [`${lib.id}-favicon.svg`, `${lib.id}-social.png`, `${lib.id}-mark.svg`]) {
    await copyFile(join('brand', lib.id, file), join(out, 'brand', file));
  }

  for (const page of pages) {
    const env = { resolve: resolver(plan, page.file, page.slug), mermaid: false };
    let overview = null;
    if (page.intro) {
      overview = {
        tagline: page.intro.tagline ? renderInline(page.intro.tagline, env) : null,
        glance: page.intro.tokens.length ? render(page.intro.tokens, env) : '',
      };
    }
    const html = render(page.tokens, env);
    const toc = headingsOf(page.tokens, 'h2');
    const legacy = page.slug === '' ? legacyMap(plan, page) : null;

    const path = `/${lib.id}/${page.slug ? `${page.slug}/` : ''}`;
    urls.push(path);
    await write(`${path}index.html`, libraryPage({ lib, facts, page, pages, html, toc, overview, assets, legacy, mermaid: env.mermaid }));
  }

  for (const asset of plan.assets) {
    const from = join(plan.dir, asset);
    if (!existsSync(from)) {
      problems.push(`${lib.id}: image ${asset} is not in the repository`);
      continue;
    }
    await mkdir(dirname(join(out, lib.id, 'media', asset)), { recursive: true });
    await copyFile(from, join(out, lib.id, 'media', asset));
  }

  console.log(`${lib.id} ${facts.version} from ${facts.builtFrom}: ${pages.length} pages`);
}

const all = [...plans.values()];
await write('index.html', hubPage({ all, assets }));
await write('404.html', notFoundPage({ assets }));
await write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${site.url}${url}</loc></url>`).join('\n')}
</urlset>
`);

// ---------- search ----------

const { index } = await pagefind.createIndex({});
await index.addDirectory({ path: out });
const { errors } = await index.writeFiles({ outputPath: join(out, 'pagefind') });
problems.push(...(errors ?? []));
await pagefind.close();

// ---------- check ----------

problems.push(...(await check(out)));

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`site/ written: ${urls.length} pages, every internal link resolves`);
