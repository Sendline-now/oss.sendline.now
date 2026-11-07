import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// CI builds from sources/<id>, a checkout of the library at its tag (tools/fetch-sources.mjs). Locally, OSS_SOURCES can
// point at a folder holding working copies instead, so a docs change can be previewed before it is tagged.
export const local = Boolean(process.env.OSS_SOURCES);
const root = resolve(process.env.OSS_SOURCES ?? 'sources');

export const sourceDir = (lib) => join(root, lib.id);

const read = async (dir, path) => {
  const file = join(dir, path);
  if (!existsSync(file)) throw new Error(`${file} is missing; run npm run fetch, or set OSS_SOURCES`);
  return readFile(file, 'utf8');
};

// The facts every page shows come from the build itself: version and organization from build.sbt, and every pinned
// version from the Versions object in project/Dependencies.scala, keyed by its val name.
export const readFacts = async (lib) => {
  const dir = sourceDir(lib);
  const build = await read(dir, 'build.sbt');
  const deps = await read(dir, 'project/Dependencies.scala');

  const version = build.match(/^\s*version\s*:=\s*"([^"]+)"/m)?.[1];
  const organization =
    build.match(/currentOrganization\s*=\s*"([^"]+)"/)?.[1] ?? build.match(/^\s*organization\s*:=\s*"([^"]+)"/m)?.[1];
  if (!version || !organization) throw new Error(`${lib.id}: no version or organization in build.sbt`);

  const versions = {};
  for (const [, name, value] of deps.matchAll(/^\s*val\s+(\w+)\s*=\s*"([^"]+)"\s*$/gm)) versions[name] ??= value;

  const pick = (key) => {
    if (!versions[key]) throw new Error(`${lib.id}: no val ${key} in project/Dependencies.scala`);
    return versions[key];
  };

  return {
    version,
    organization,
    ref: `v${version}`,
    builtFrom: local ? 'the working tree' : lib.tag,
    scala: pick(lib.versions.scala),
    runtimes: Object.fromEntries(['cats', 'zio', 'kyo', 'rapid'].map((id) => [id, pick(lib.versions[id])])),
    all: versions,
  };
};
