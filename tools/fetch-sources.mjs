import { execFileSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { libraries } from '../site.config.mjs';

// Each library at the ref site.config.mjs names (its release tag, or a branch until it has one), shallow, into
// sources/<id>. A ref that does not exist fails the build here rather than publishing pages from the wrong commit.
for (const lib of libraries) {
  const dir = join('sources', lib.id);
  await rm(dir, { recursive: true, force: true });
  execFileSync(
    'git',
    ['-c', 'advice.detachedHead=false', 'clone', '--quiet', '--depth', '1', '--branch', lib.ref, `https://github.com/${lib.repo}.git`, dir],
    { stdio: 'inherit' },
  );
  const commit = execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  console.log(`${lib.id}: ${lib.repo} at ${lib.ref} (${commit})`);
}
