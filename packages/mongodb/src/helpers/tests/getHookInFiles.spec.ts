import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  FIXTURE_DIRECTORY_PATH,
  getDirectoryEntries,
  getExpectedDefaultFunctionResults,
  getExpectedHookInFileParts,
} from './getHookInFiles.data';
import type { HookInFile } from '../../resolverClasses/types';

// ESM has no automocking, so the members this unit reaches for are named
// explicitly, and the unit under test is imported after the mocks are
// registered. The dynamic `import()` inside the unit is deliberately left
// unmocked so that it loads the real fixture modules from disk.
const existsSync = jest.fn<(path: string) => boolean>();
const readdirSync =
  jest.fn<(path: string, options: { recursive: boolean }) => string[]>();

jest.unstable_mockModule('fs', () => ({ existsSync, readdirSync }));

const { getHookInFiles } = await import('../getHookInFiles');

/**
 * The fixture modules return an identifying string rather than `void`, so the
 * declared `HookInFunction` signature has to be widened to read it back.
 */
async function callDefaultFunction(hookInFile: HookInFile): Promise<string> {
  const defaultFunction =
    hookInFile.defaultFunction as unknown as () => Promise<string>;
  return await defaultFunction();
}

describe('getHookInFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(true);
    readdirSync.mockReturnValue(getDirectoryEntries());
  });

  it('should be defined', () => {
    // Assert
    expect(getHookInFiles).toBeDefined();
  });

  it('should return an empty array if the directory does not exist', async () => {
    // Arrange
    existsSync.mockReturnValueOnce(false);

    // Act
    const result = await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    expect(result).toEqual([]);
    expect(existsSync).toHaveBeenCalledWith(FIXTURE_DIRECTORY_PATH);
    expect(readdirSync).not.toHaveBeenCalled();
  });

  it('should read the directory recursively', async () => {
    // Act
    await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    expect(readdirSync).toHaveBeenCalledTimes(1);
    expect(readdirSync).toHaveBeenCalledWith(FIXTURE_DIRECTORY_PATH, {
      recursive: true,
    });
  });

  it('should ignore directory entries that are not .ts or .js files', async () => {
    // Act
    const result = await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    const returnedFilenames = result.map((hookInFile) => hookInFile.filename);
    expect(returnedFilenames).not.toContain('README.md');
    expect(returnedFilenames).not.toContain('notes.txt');
    expect(returnedFilenames).not.toContain('nested');
  });

  it('should return the parsed parts of every hook in file in directory order', async () => {
    // Act
    const result = await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    expect(
      result.map(({ filename, resolverName, hookPoint, orderNumber }) => ({
        filename,
        resolverName,
        hookPoint,
        orderNumber,
      }))
    ).toEqual(getExpectedHookInFileParts());
  });

  it('should default the order number to 0 when the filename has no order part', async () => {
    // Arrange
    readdirSync.mockReturnValueOnce(['update-preCommit.js']);

    // Act
    const result = await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].orderNumber).toBe(0);
    expect(result[0].resolverName).toBe('update');
    expect(result[0].hookPoint).toBe('preCommit');
  });

  it('should default the order number to 0 when the order part is not a number', async () => {
    // Arrange
    readdirSync.mockReturnValueOnce(['delete-postCommit-notANumber.js']);

    // Act
    const result = await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].orderNumber).toBe(0);
  });

  it('should import the compiled .js module for a .ts hook in file', async () => {
    // Arrange
    readdirSync.mockReturnValueOnce(['create-preValidateDocument-1.ts']);

    // Act
    const result = await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('create-preValidateDocument-1.ts');
    expect(result[0].orderNumber).toBe(1);
    await expect(callDefaultFunction(result[0])).resolves.toBe(
      'create-preValidateDocument-1'
    );
  });

  it('should attach the default export of every hook in file', async () => {
    // Arrange
    const expectedResults = getExpectedDefaultFunctionResults();

    // Act
    const result = await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    expect(result).toHaveLength(Object.keys(expectedResults).length);
    for (const hookInFile of result) {
      expect(typeof hookInFile.defaultFunction).toBe('function');
      await expect(callDefaultFunction(hookInFile)).resolves.toBe(
        expectedResults[hookInFile.filename]
      );
    }
  });

  it('should return an empty array when the directory holds no scripts', async () => {
    // Arrange
    readdirSync.mockReturnValueOnce(['README.md']);

    // Act
    const result = await getHookInFiles(FIXTURE_DIRECTORY_PATH);

    // Assert
    expect(result).toEqual([]);
  });
});
