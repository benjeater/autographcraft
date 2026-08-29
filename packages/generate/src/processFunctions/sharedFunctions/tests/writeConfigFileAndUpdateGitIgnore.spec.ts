import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { join } from 'path';
import util from 'node:util';
import {
  CONFIG_FILE_NAME,
  GIT_IGNORE_LABEL,
  LOGGER_FILE_PATH,
} from '@autographcraft/core';
import {
  GIT_IGNORE_EMPTY,
  GIT_IGNORE_FULLY_POPULATED,
  GIT_IGNORE_WITHOUT_LABEL,
  GIT_IGNORE_WITHOUT_LABEL_OR_TRAILING_BLANK,
  GIT_IGNORE_WITH_EMPTY_LABEL,
  GIT_IGNORE_WITH_EMPTY_LABEL_AND_LEADING_CONTENT,
  GIT_IGNORE_WITH_PREVIOUS_VALUES,
  GIT_IGNORE_WITH_PREVIOUS_VALUES_ABOVE_AND_BELOW_LABEL,
  GIT_IGNORE_WITH_PREVIOUS_VALUES_AND_LEADING_CONTENT,
  getDefaultConfig,
  getNewConfig,
  getPreviousConfig,
} from './writeConfigFileAndUpdateGitIgnore.data';

// ESM has no automocking, so the file system members this unit reaches for are
// named explicitly and the unit under test is imported after the mock is
// registered. Nothing may actually be written to disk.
const writeFileSync = jest.fn<(path: string, content: string) => void>();
const readFileSync =
  jest.fn<(path: string, options: { encoding: string }) => string>();

jest.unstable_mockModule('node:fs', () => ({ writeFileSync, readFileSync }));

const { writeConfigFileAndUpdateGitIgnore } =
  await import('../writeConfigFileAndUpdateGitIgnore');

const CWD = '/project';

/**
 * The second `writeFileSync` call is the `.gitignore` update; the first is the
 * config file itself.
 */
function getWrittenGitIgnoreLines(): string[] {
  const call = writeFileSync.mock.calls[1];
  return call[1].split('\n');
}

describe('writeConfigFileAndUpdateGitIgnore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readFileSync.mockReturnValue(GIT_IGNORE_FULLY_POPULATED);
  });

  it('should be defined', () => {
    // Assert
    expect(writeConfigFileAndUpdateGitIgnore).toBeDefined();
  });

  it('should write the configuration as an importable module', () => {
    // Arrange
    const config = getDefaultConfig();

    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, config, undefined);

    // Assert
    expect(writeFileSync).toHaveBeenCalledTimes(2);
    expect(writeFileSync.mock.calls[0][0]).toBe(join(CWD, CONFIG_FILE_NAME));
    expect(writeFileSync.mock.calls[0][1]).toBe(
      [
        `/** @type {import('@autographcraft/core').AutoGraphCraftConfigurationOutput} **/`,
        `export const config = ${util.inspect(config, false)};`,
        '',
        'export default config;',
        '',
      ].join('\n')
    );
  });

  it('should read and write the gitignore at the configured path', () => {
    // Arrange
    const config = getDefaultConfig();
    config.gitIgnorePath = 'packages/api/.gitignore';

    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, config, undefined);

    // Assert
    const gitIgnorePath = join(CWD, 'packages/api/.gitignore');
    expect(readFileSync).toHaveBeenCalledWith(gitIgnorePath, {
      encoding: 'utf8',
    });
    expect(writeFileSync.mock.calls[1][0]).toBe(gitIgnorePath);
  });

  it('should leave a fully populated gitignore untouched', () => {
    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, getDefaultConfig(), undefined);

    // Assert
    expect(writeFileSync.mock.calls[1][1]).toBe(GIT_IGNORE_FULLY_POPULATED);
  });

  it('should append the label and every ignored path when the label is missing', () => {
    // Arrange
    readFileSync.mockReturnValueOnce(GIT_IGNORE_WITHOUT_LABEL);

    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, getDefaultConfig(), undefined);

    // Assert
    expect(getWrittenGitIgnoreLines()).toEqual([
      'node_modules',
      'dist',
      '',
      GIT_IGNORE_LABEL,
      LOGGER_FILE_PATH,
      'src/models/*/*',
      '!src/models/*/hookIns',
      'src/generatedUtils',
      'src/generatedDatabase',
      'src/generatedTypes',
    ]);
  });

  it('should separate the label from content that does not end with a blank line', () => {
    // Arrange
    readFileSync.mockReturnValueOnce(
      GIT_IGNORE_WITHOUT_LABEL_OR_TRAILING_BLANK
    );

    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, getDefaultConfig(), undefined);

    // Assert
    expect(getWrittenGitIgnoreLines()).toEqual([
      'node_modules',
      'dist',
      '',
      GIT_IGNORE_LABEL,
      LOGGER_FILE_PATH,
      'src/models/*/*',
      '!src/models/*/hookIns',
      'src/generatedUtils',
      'src/generatedDatabase',
      'src/generatedTypes',
    ]);
  });

  it('should not write a leading blank line into an empty gitignore', () => {
    // Arrange
    readFileSync.mockReturnValueOnce(GIT_IGNORE_EMPTY);

    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, getDefaultConfig(), undefined);

    // Assert
    expect(getWrittenGitIgnoreLines()).toEqual([
      GIT_IGNORE_LABEL,
      LOGGER_FILE_PATH,
      'src/models/*/*',
      '!src/models/*/hookIns',
      'src/generatedUtils',
      'src/generatedDatabase',
      'src/generatedTypes',
    ]);
  });

  it('should add the missing paths under an existing but empty label', () => {
    // Arrange
    readFileSync.mockReturnValueOnce(GIT_IGNORE_WITH_EMPTY_LABEL);

    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, getDefaultConfig(), undefined);

    // Assert
    expect(getWrittenGitIgnoreLines()).toEqual([
      'node_modules',
      GIT_IGNORE_LABEL,
      LOGGER_FILE_PATH,
      'src/models/*/*',
      '!src/models/*/hookIns',
      'src/generatedUtils',
      'src/generatedDatabase',
      'src/generatedTypes',
    ]);
  });

  it('should replace the lines of the previous configuration in place', () => {
    // Arrange
    readFileSync.mockReturnValueOnce(GIT_IGNORE_WITH_PREVIOUS_VALUES);

    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, getNewConfig(), getPreviousConfig());

    // Assert
    expect(getWrittenGitIgnoreLines()).toEqual([
      'node_modules',
      GIT_IGNORE_LABEL,
      'src/newTypes',
      'src/newDatabase',
      'src/newUtils',
      'src/newModels/*/*',
      '!src/newModels/*/hookIns',
      LOGGER_FILE_PATH,
    ]);
  });

  it('should insert new lines when the previous configuration is not in the gitignore', () => {
    // Arrange
    readFileSync.mockReturnValueOnce(GIT_IGNORE_WITH_EMPTY_LABEL);

    // Act
    writeConfigFileAndUpdateGitIgnore(CWD, getNewConfig(), getPreviousConfig());

    // Assert
    expect(getWrittenGitIgnoreLines()).toEqual([
      'node_modules',
      GIT_IGNORE_LABEL,
      LOGGER_FILE_PATH,
      'src/newModels/*/*',
      '!src/newModels/*/hookIns',
      'src/newUtils',
      'src/newDatabase',
      'src/newTypes',
    ]);
  });

  // The index of a managed line is derived from the index of the label, so a
  // label that is not near the top of the file is what distinguishes a correct
  // origin from one that double-counts or drops it
  describe('when the label is not at the top of the gitignore', () => {
    it('should insert the new lines directly under the label', () => {
      // Arrange
      readFileSync.mockReturnValueOnce(
        GIT_IGNORE_WITH_EMPTY_LABEL_AND_LEADING_CONTENT
      );

      // Act
      writeConfigFileAndUpdateGitIgnore(
        CWD,
        getNewConfig(),
        getPreviousConfig()
      );

      // Assert
      expect(getWrittenGitIgnoreLines()).toEqual([
        'node_modules',
        'dist',
        'coverage',
        '',
        GIT_IGNORE_LABEL,
        LOGGER_FILE_PATH,
        'src/newModels/*/*',
        '!src/newModels/*/hookIns',
        'src/newUtils',
        'src/newDatabase',
        'src/newTypes',
      ]);
    });

    it('should replace the lines of the previous configuration in place', () => {
      // Arrange
      readFileSync.mockReturnValueOnce(
        GIT_IGNORE_WITH_PREVIOUS_VALUES_AND_LEADING_CONTENT
      );

      // Act
      writeConfigFileAndUpdateGitIgnore(
        CWD,
        getNewConfig(),
        getPreviousConfig()
      );

      // Assert
      expect(getWrittenGitIgnoreLines()).toEqual([
        'node_modules',
        'dist',
        'coverage',
        '',
        GIT_IGNORE_LABEL,
        'src/newTypes',
        'src/newDatabase',
        'src/newUtils',
        'src/newModels/*/*',
        '!src/newModels/*/hookIns',
        LOGGER_FILE_PATH,
      ]);
    });

    it('should only replace lines below the label', () => {
      // Arrange
      readFileSync.mockReturnValueOnce(
        GIT_IGNORE_WITH_PREVIOUS_VALUES_ABOVE_AND_BELOW_LABEL
      );

      // Act
      writeConfigFileAndUpdateGitIgnore(
        CWD,
        getNewConfig(),
        getPreviousConfig()
      );

      // Assert
      expect(getWrittenGitIgnoreLines()).toEqual([
        // Lines above the label are not managed and are left alone
        'src/oldTypes',
        'src/oldDatabase',
        '',
        GIT_IGNORE_LABEL,
        'src/newTypes',
        'src/newDatabase',
        'src/newUtils',
        'src/newModels/*/*',
        '!src/newModels/*/hookIns',
        LOGGER_FILE_PATH,
      ]);
    });
  });
});
