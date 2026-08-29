import {
  jest,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { join } from 'path';
import { pathToFileURL } from 'node:url';
import {
  CONFIG_FILE_NAME,
  DATABASE_CODES,
  MONGO_DB_CONNECTION_LIBRARY,
} from '@autographcraft/core';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import {
  CURRENT_WORKING_DIRECTORY,
  STRING_FIELD_CASES,
  getValidConfiguration,
} from './getExistingConfiguration.data';

// ESM has no automocking, so the members this unit reaches for are named
// explicitly and the unit under test is imported after the mocks are
// registered.
const existsSync = jest.fn<(path: string | URL) => boolean>();
jest.unstable_mockModule('node:fs', () => ({ existsSync }));

// The real logger writes to a file, so the whole of `@autographcraft/core` is
// replaced with the members this unit reaches for; the constants and enums are
// passed straight through.
const warnSpy = jest.fn<(message: string) => void>();
const endSpy = jest.fn<() => void>();
jest.unstable_mockModule('@autographcraft/core', () => ({
  CONFIG_FILE_NAME,
  DATABASE_CODES,
  MONGO_DB_CONNECTION_LIBRARY,
  logger: { warn: warnSpy, end: endSpy },
}));

const CONFIG_FILE_PATH = join(CURRENT_WORKING_DIRECTORY, CONFIG_FILE_NAME);
const CONFIG_FILE_URL = pathToFileURL(CONFIG_FILE_PATH);
const GIT_IGNORE_PATH = join(CURRENT_WORKING_DIRECTORY, '.gitignore');

// The unit `import()`s the project's config file by its file URL. The module
// registry caches that import, so the mock exposes a single object whose
// contents each test rewrites in place.
const configObject: Record<string, unknown> = {};
jest.unstable_mockModule(CONFIG_FILE_PATH, () => ({ default: configObject }), {
  virtual: true,
});

const { getExistingConfiguration } =
  await import('../getExistingConfiguration');

/**
 * Runs the unit expecting it to bail out through `process.exit`.
 */
async function runExpectingExit(): Promise<void> {
  await expect(
    getExistingConfiguration(CURRENT_WORKING_DIRECTORY)
  ).rejects.toBeInstanceOf(ProcessExitError);
  // Every bail-out flushes the logger before exiting.
  expect(endSpy).toHaveBeenCalledTimes(1);
}

function setConfig(config: Record<string, unknown>): void {
  for (const key of Object.keys(configObject)) {
    delete configObject[key];
  }
  Object.assign(configObject, config);
}

// `process.exit` is stubbed so a validation failure does not tear down the
// test worker. It throws instead of returning, which keeps the production
// control flow honest: in a real run nothing after the exit is executed.
class ProcessExitError extends Error {
  constructor(readonly code: number) {
    super(`process.exit(${code})`);
  }
}

const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new ProcessExitError(Number(code ?? 0));
});

describe('getExistingConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(true);
    setConfig(getValidConfiguration());
  });

  afterAll(() => {
    exitSpy.mockRestore();
  });

  it('should be defined', () => {
    // Assert
    expect(getExistingConfiguration).toBeDefined();
  });

  it('should return undefined when no config file exists', async () => {
    // Arrange
    existsSync.mockReturnValue(false);

    // Act
    const result = await getExistingConfiguration(CURRENT_WORKING_DIRECTORY);

    // Assert
    expect(result).toBeUndefined();
    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(existsSync.mock.calls[0][0]?.toString()).toBe(
      CONFIG_FILE_URL.toString()
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should return the default export of the config file when it is valid', async () => {
    // Act
    const result = await getExistingConfiguration(CURRENT_WORKING_DIRECTORY);

    // Assert
    expect(result).toEqual(getValidConfiguration());
    expect(warnSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(existsSync).toHaveBeenCalledWith(GIT_IGNORE_PATH);
  });

  describe.each(STRING_FIELD_CASES)(
    '%s',
    (field, notSetMessage, notAStringMessage) => {
      it('should warn and exit when the field is not set', async () => {
        // Arrange
        const config = getValidConfiguration();
        delete config[field];
        setConfig(config);

        // Act
        await runExpectingExit();

        // Assert
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(notSetMessage);
        expect(exitSpy).toHaveBeenCalledWith(1);
      });

      it('should warn and exit when the field is not a string', async () => {
        // Arrange
        setConfig({ ...getValidConfiguration(), [field]: 1234 });

        // Act
        await runExpectingExit();

        // Assert
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(notAStringMessage);
        expect(exitSpy).toHaveBeenCalledWith(1);
      });
    }
  );

  it('should warn when no file exists at the git ignore path', async () => {
    // Arrange
    existsSync.mockImplementation((path) => path !== GIT_IGNORE_PATH);

    // Act
    await runExpectingExit();

    // Assert
    expect(warnSpy).toHaveBeenCalledWith(
      '⚠️ No file exists at the git ignore path; either create the file or update the path'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  describe('databaseType', () => {
    it('should warn and exit when the database type is not set', async () => {
      // Arrange
      const config = getValidConfiguration();
      delete config.databaseType;
      setConfig(config);

      // Act
      await runExpectingExit();

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ The database type is not set; please fix this'
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should warn and exit when the database type is not a string', async () => {
      // Arrange
      setConfig({ ...getValidConfiguration(), databaseType: 1234 });

      // Act
      await runExpectingExit();

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ The database type is not a string; please fix this'
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should warn and exit when the database type is not a known code', async () => {
      // Arrange
      setConfig({ ...getValidConfiguration(), databaseType: 'NOT_A_DATABASE' });

      // Act
      await runExpectingExit();

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ The database type is not a valid database type; please fix this'
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should accept every known database code', async () => {
      for (const databaseType of Object.values(DATABASE_CODES)) {
        // Arrange
        setConfig({ ...getValidConfiguration(), databaseType });

        // Act
        await getExistingConfiguration(CURRENT_WORKING_DIRECTORY);
      }

      // Assert
      expect(warnSpy).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('mongoDbConnectionLibrary', () => {
    it('should skip the validation when the library is not set', async () => {
      // Arrange
      const config = getValidConfiguration();
      delete config.mongoDbConnectionLibrary;
      setConfig(config);

      // Act
      const result = await getExistingConfiguration(CURRENT_WORKING_DIRECTORY);

      // Assert
      expect(result).toEqual(config);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should warn and exit when the library is not a string', async () => {
      // Arrange
      setConfig({ ...getValidConfiguration(), mongoDbConnectionLibrary: 1234 });

      // Act
      await runExpectingExit();

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ The MongoDB connection library is not a string; please fix this'
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should warn and exit when the library is not a known value', async () => {
      // Arrange
      setConfig({
        ...getValidConfiguration(),
        mongoDbConnectionLibrary: 'NOT_A_LIBRARY',
      });

      // Act
      await runExpectingExit();

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ The database type is not a valid database type; please fix this'
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should accept every known connection library', async () => {
      for (const mongoDbConnectionLibrary of Object.values(
        MONGO_DB_CONNECTION_LIBRARY
      )) {
        // Arrange
        setConfig({ ...getValidConfiguration(), mongoDbConnectionLibrary });

        // Act
        await getExistingConfiguration(CURRENT_WORKING_DIRECTORY);
      }

      // Assert
      expect(warnSpy).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });

  describe('authorisationStructure', () => {
    it('should skip the validation when the structure is not set', async () => {
      // Arrange
      const config = getValidConfiguration();
      delete config.authorisationStructure;
      setConfig(config);

      // Act
      const result = await getExistingConfiguration(CURRENT_WORKING_DIRECTORY);

      // Assert
      expect(result).toEqual(config);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should warn and exit when the structure is not an array', async () => {
      // Arrange
      setConfig({
        ...getValidConfiguration(),
        authorisationStructure: { not: 'an array' },
      });

      // Act
      await runExpectingExit();

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ The authorisation structure is not an array; please fix this'
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should accept a populated authorisation structure', async () => {
      // Arrange
      const authorisationStructure = [{ targetModelName: 'User' }];
      setConfig({ ...getValidConfiguration(), authorisationStructure });

      // Act
      const result = (await getExistingConfiguration(
        CURRENT_WORKING_DIRECTORY
      )) as AutoGraphCraftConfiguration;

      // Assert
      expect(result.authorisationStructure).toEqual(authorisationStructure);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });
});
