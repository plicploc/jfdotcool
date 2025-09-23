// scripts/ensure-clean.mjs
import { execSync } from 'node:child_process';

function sh(cmd) { return execSync(cmd, { stdio: 'pipe' }).toString().trim(); }

const status = sh('git status --porcelain');
if (status) {
  console.error('✖ Repo not clean. Commit/stash before releasing:\n' + status);
  process.exit(1);
}

try {
  sh('git rev-parse --is-inside-work-tree');
} catch {
  console.error('✖ Not a git repository.');
  process.exit(1);
}
