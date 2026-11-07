import { existsSync, statSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Every internal href and src in the built site has to reach a file, and every #fragment an id on that page — the
// way GitHub Pages will serve it, with /dir/ answered by /dir/index.html.

const htmlFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === 'pagefind' ? [] : htmlFiles(path);
      return entry.name.endsWith('.html') ? [path] : [];
    }),
  );
  return nested.flat();
};

const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export const check = async (root) => {
  const problems = [];
  const ids = new Map();
  const files = await htmlFiles(root);

  const idsOf = async (file) => {
    if (!ids.has(file)) {
      const html = await readFile(file, 'utf8');
      ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => decode(m[1]))));
    }
    return ids.get(file);
  };

  const target = (url) => {
    const path = join(root, decodeURIComponent(url));
    if (existsSync(path) && statSync(path).isFile()) return path;
    if (existsSync(join(path, 'index.html'))) return url.endsWith('/') ? join(path, 'index.html') : `redirect:${url}/`;
    return null;
  };

  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const page = '/' + relative(root, file).split(sep).join('/');
    const where = page.replace(/index\.html$/, '');

    for (const [, attr, raw] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
      const value = decode(raw);
      if (!value || /^(https?:|mailto:|data:|\/\/)/.test(value)) continue;
      if (attr === 'href' && value === '#') continue;

      const [pathPart, fragment] = value.split('#');
      const absolute = pathPart ? new URL(pathPart, `http://site${page}`).pathname : page;
      const found = pathPart ? target(absolute.split('?')[0]) : file;

      if (!found) {
        problems.push(`${where}: ${attr}="${value}" reaches nothing`);
      } else if (found.startsWith('redirect:')) {
        problems.push(`${where}: ${attr}="${value}" works only through a redirect to ${found.slice(9)}`);
      } else if (fragment && found.endsWith('.html') && !(await idsOf(found)).has(decodeURIComponent(fragment))) {
        problems.push(`${where}: ${attr}="${value}" has no #${fragment} on its page`);
      }
    }
  }

  return problems;
};

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  const problems = await check(process.argv[2] ?? 'site');
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log('every internal link resolves');
}
