import { execFileSync } from 'node:child_process';

export function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd();
}

export function resolveCommit(ref) {
  return git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]);
}

/** Compare the whole PR. Missing refs are errors, never an empty diff. */
export function getPrComparison(env = process.env) {
  const base = resolveCommit(
    env.GITHUB_BASE_SHA ||
      env.BASE_SHA ||
      `origin/${env.GITHUB_BASE_REF || 'main'}`
  );
  const head = resolveCommit(env.GITHUB_HEAD_SHA || env.HEAD_SHA || 'HEAD');
  const mergeBase = git(['merge-base', base, head]);
  if (env.DEBUG === '1') {
    console.log(`Comparing ${mergeBase}..${head} (PR base ${base})`);
  }
  return { mergeBase, head };
}

export function getPrChanges({ mergeBase, head }) {
  const fields = git([
    'diff',
    '--name-status',
    '-z',
    '--find-renames=100%',
    mergeBase,
    head,
    '--',
  ]).split('\0');
  const changes = [];
  for (let index = 0; index < fields.length - 1; ) {
    const status = fields[index++];
    const path = fields[index++];
    changes.push(
      /^[RC]/.test(status)
        ? { status, oldPath: path, path: fields[index++] }
        : { status, path }
    );
  }
  return changes;
}

export function getChangedFiles(env = process.env) {
  if (env.GITHUB_EVENT_NAME === 'pull_request' || env.GITHUB_BASE_SHA) {
    return getPrChanges(getPrComparison(env)).flatMap(({ path, oldPath }) =>
      oldPath ? [oldPath, path] : [path]
    );
  }
  const head = resolveCommit('HEAD');
  const parents = git(['rev-list', '--parents', '-n', '1', head]).split(' ');
  const before = env.GITHUB_BEFORE_SHA;
  if ((before && /^0+$/.test(before)) || (!before && parents.length === 1)) {
    return git(['ls-tree', '-r', '--name-only', '-z', head])
      .split('\0')
      .filter(Boolean);
  }
  const base = resolveCommit(before || `${head}^1`);
  return git(['diff', '--name-only', '-z', base, head, '--'])
    .split('\0')
    .filter(Boolean);
}
