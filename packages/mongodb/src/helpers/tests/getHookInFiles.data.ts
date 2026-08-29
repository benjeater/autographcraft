import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const currentDirectoryPath = dirname(fileURLToPath(import.meta.url));

/**
 * The directory holding the real hook-in modules that `getHookInFiles`
 * dynamically imports. `readdirSync` is mocked in the spec, so the filenames it
 * reports are decoupled from what is on disk; only the `.js` files that the
 * dynamic import resolves to actually need to exist here.
 */
export const FIXTURE_DIRECTORY_PATH = join(
  currentDirectoryPath,
  'hookInFileFixtures'
);

/**
 * The entries a recursive `readdirSync` of the fixture directory would return,
 * including entries that are not hook-in modules (a directory and two
 * non-script files) and two `.ts` entries whose compiled `.js` siblings are the
 * files that are actually imported.
 */
const directoryEntries = [
  'create-preValidateDocument-1.ts',
  'nested',
  'nested/list-preFetch-3.js',
  'update-preCommit.js',
  'delete-postCommit-notANumber.js',
  'read-postFetch-2.ts',
  'README.md',
  'notes.txt',
];

export function getDirectoryEntries(): string[] {
  return [...directoryEntries];
}

/**
 * The `filename`, `resolverName`, `hookPoint` and `orderNumber` expected for
 * each of the script entries above, in the order `getHookInFiles` returns them.
 * The `defaultFunction` is asserted separately by calling it, so it is not
 * included here.
 */
const expectedHookInFileParts = [
  {
    filename: 'create-preValidateDocument-1.ts',
    resolverName: 'create',
    hookPoint: 'preValidateDocument',
    orderNumber: 1,
  },
  {
    filename: 'nested/list-preFetch-3.js',
    resolverName: 'list',
    hookPoint: 'preFetch',
    orderNumber: 3,
  },
  {
    filename: 'update-preCommit.js',
    resolverName: 'update',
    hookPoint: 'preCommit',
    orderNumber: 0,
  },
  {
    filename: 'delete-postCommit-notANumber.js',
    resolverName: 'delete',
    hookPoint: 'postCommit',
    orderNumber: 0,
  },
  {
    filename: 'read-postFetch-2.ts',
    resolverName: 'read',
    hookPoint: 'postFetch',
    orderNumber: 2,
  },
];

export function getExpectedHookInFileParts() {
  return expectedHookInFileParts.map((part) => ({ ...part }));
}

/**
 * The value the default export of each fixture module resolves to, keyed by the
 * filename reported by `readdirSync`.
 */
const expectedDefaultFunctionResults: Record<string, string> = {
  'create-preValidateDocument-1.ts': 'create-preValidateDocument-1',
  'nested/list-preFetch-3.js': 'nested/list-preFetch-3',
  'update-preCommit.js': 'update-preCommit',
  'delete-postCommit-notANumber.js': 'delete-postCommit-notANumber',
  'read-postFetch-2.ts': 'read-postFetch-2',
};

export function getExpectedDefaultFunctionResults(): Record<string, string> {
  return { ...expectedDefaultFunctionResults };
}
