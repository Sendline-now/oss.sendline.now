import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'site');
const port = Number(process.argv[3] ?? 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

const isFile = async (path) => (await stat(path).catch(() => null))?.isFile() ?? false;
const isDir = async (path) => (await stat(path).catch(() => null))?.isDirectory() ?? false;

const send = async (res, status, path) => {
  res.writeHead(status, { 'content-type': types[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(await readFile(path));
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = normalize(join(root, decodeURIComponent(url.pathname)));

  if (!path.startsWith(root)) return res.writeHead(403).end();

  if (await isFile(path)) return send(res, 200, path);

  if (await isDir(path)) {
    if (!url.pathname.endsWith('/')) return res.writeHead(301, { location: `${url.pathname}/${url.search}` }).end();
    if (await isFile(join(path, 'index.html'))) return send(res, 200, join(path, 'index.html'));
  }

  if (await isFile(join(root, '404.html'))) return send(res, 404, join(root, '404.html'));

  res.writeHead(404).end('not found');
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
