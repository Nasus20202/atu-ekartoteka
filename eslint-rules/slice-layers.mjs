/**
 * Shape of a domain slice (src/lib/<slice>/<folder>/) and the folders each kind
 * of folder may import. Layers only point downwards: pure models and rules
 * never reach the database, queries never reach use cases, and nothing in a
 * slice imports a use case except another use case, a runtime or a job.
 */

export const SLICE_FOLDERS = [
  'types',
  'dto',
  'rules',
  'parsers',
  'template',
  'gateways',
  'validation',
  'queries',
  'mutations',
  'importers',
  'pipeline',
  'runtime',
  'jobs',
  'use-cases',
];

// Folders that are not domain slices: infrastructure, the framework edge and
// code shared across slices.
export const NON_SLICE_LIB = new Set(['framework', 'platform', 'shared']);

// Folders that hold no database access, no I/O and no framework code.
export const PURE_FOLDERS = new Set([
  'types',
  'dto',
  'rules',
  'parsers',
  'template',
  'validation',
]);

export const ALLOWED_IMPORTS = {
  types: ['types'],
  dto: ['types', 'dto', 'rules'],
  rules: ['types', 'dto', 'rules', 'parsers'],
  parsers: ['types', 'dto', 'rules', 'parsers'],
  template: ['template', 'rules'],
  gateways: ['types', 'rules', 'gateways'],
  validation: ['types', 'dto', 'rules', 'parsers', 'validation'],
  queries: ['types', 'dto', 'rules', 'queries'],
  mutations: ['types', 'dto', 'rules', 'queries', 'mutations'],
  importers: [
    'types',
    'dto',
    'rules',
    'parsers',
    'validation',
    'importers',
    'queries',
    'mutations',
  ],
  pipeline: [
    'types',
    'dto',
    'rules',
    'parsers',
    'validation',
    'importers',
    'queries',
    'mutations',
    'pipeline',
  ],
  runtime: SLICE_FOLDERS,
  jobs: SLICE_FOLDERS,
  'use-cases': SLICE_FOLDERS,
};

// Components render what queries return; the write and orchestration folders
// are reached through a Server Action or an API route.
export const COMPONENT_FORBIDDEN_FOLDERS = [
  'use-cases',
  'runtime',
  'jobs',
  'pipeline',
  'importers',
  'gateways',
];

// Shared code may depend on domain models, never on domain behaviour.
export const SHARED_ALLOWED_FOLDERS = ['types'];

/**
 * Splits a path below src/lib (e.g. "auth/rules/email.ts") into its slice and
 * folder. A segment with a dot at the slice root is a loose file.
 */
export function parseLibPath(rel) {
  const [slice, ...rest] = rel.split('/');
  const isRootFile = rest.length === 1 && !SLICE_FOLDERS.includes(rest[0]);
  const folder = rest.length >= 1 && !isRootFile ? rest[0] : null;
  return { slice, folder, isRootFile, depth: rest.length };
}

/** Folder of the importing file: a slice folder, or the non-slice area it lives in. */
export function importerOf(filename) {
  if (isComponentFile(filename)) return { kind: 'components' };
  const rel = libPathOf(filename);
  if (!rel) return null;
  const loc = parseLibPath(rel);
  if (NON_SLICE_LIB.has(loc.slice)) return { kind: loc.slice };
  if (!loc.folder || !SLICE_FOLDERS.includes(loc.folder)) return null;
  return { kind: loc.folder, slice: loc.slice };
}

export function libPathOf(filename) {
  const normalized = filename.replaceAll('\\', '/');
  const match = /(?:^|\/)src\/lib\/(.+)$/.exec(normalized);
  return match ? match[1] : null;
}

export function isComponentFile(filename) {
  return /(?:^|\/)src\/components\//.test(filename.replaceAll('\\', '/'));
}

export function isTestFile(filename) {
  const normalized = filename.replaceAll('\\', '/');
  return /\/__tests__\/|\.test\.[cm]?[jt]sx?$/.test(normalized);
}
