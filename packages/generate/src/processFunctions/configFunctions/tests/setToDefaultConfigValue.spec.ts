import {
  jest,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import type {
  AutoGraphCraftConfiguration,
  AutoGraphCraftConfigurationField,
} from '@autographcraft/core';
import type { ProcessFunctionParams } from '../../../types';

// ESM has no automocking, so every module this unit reaches for is named
// explicitly. The real core module is spread so `DEFAULT_CONFIG` keeps its
// real values, and only the file-writing logger is replaced.
const actualCore = jest.requireActual<typeof import('@autographcraft/core')>(
  '@autographcraft/core'
);

jest.unstable_mockModule('@autographcraft/core', () => ({
  ...actualCore,
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    end: jest.fn(),
  },
}));

const writeConfigFileAndUpdateGitIgnore = jest.fn();
const validateAuthConfiguration = jest.fn();

jest.unstable_mockModule('../../sharedFunctions', () => ({
  writeConfigFileAndUpdateGitIgnore,
  validateAuthConfiguration,
}));

const questionSetConfigurationValueToDefaultConfirmation =
  jest.fn<(key: AutoGraphCraftConfigurationField) => Promise<boolean>>();

jest.unstable_mockModule('../questions', () => ({
  questionSetConfigurationValueConfirmation: jest.fn(),
  questionSetConfigurationValueToDefaultConfirmation,
}));

const { logger, DEFAULT_CONFIG } = await import('@autographcraft/core');
const { setToDefaultConfigValue } = await import('../setToDefaultConfigValue');

const CWD = '/project';

const exitSpy = jest.spyOn(process, 'exit').mockImplementation((): never => {
  throw new Error('process.exit');
});

function getExistingConfig(): AutoGraphCraftConfiguration {
  return { ...DEFAULT_CONFIG, queriesDirectory: 'src/customQueries' };
}

function getParams(key: string): ProcessFunctionParams {
  return { _: ['config', 'setToDefault', key] };
}

describe('setToDefaultConfigValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    questionSetConfigurationValueToDefaultConfirmation.mockReturnValue(
      Promise.resolve(true)
    );
  });

  afterAll(() => {
    exitSpy.mockRestore();
  });

  it('should be defined', () => {
    // Assert
    expect(setToDefaultConfigValue).toBeDefined();
  });

  it('should warn and exit when the key is not part of the configuration', async () => {
    // Arrange
    const params = getParams('notAKey');

    // Act / Assert
    await expect(
      setToDefaultConfigValue(CWD, params, 0, getExistingConfig())
    ).rejects.toThrow('process.exit');
    expect(logger.warn).toHaveBeenCalledWith(
      "Unknown key 'notAKey' provided; please check your command and try again."
    );
    expect(logger.end).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(writeConfigFileAndUpdateGitIgnore).not.toHaveBeenCalled();
  });

  it('should read the key from the position after the config argument', async () => {
    // Arrange
    const params = { _: ['npx', 'config', 'setToDefault', 'queriesDirectory'] };

    // Act
    await setToDefaultConfigValue(CWD, params, 1, getExistingConfig());

    // Assert
    expect(
      questionSetConfigurationValueToDefaultConfirmation
    ).toHaveBeenCalledWith('queriesDirectory');
  });

  it('should write the configuration with the default value merged in', async () => {
    // Arrange
    const existingConfig = getExistingConfig();
    const params = getParams('queriesDirectory');

    // Act
    await setToDefaultConfigValue(CWD, params, 0, existingConfig);

    // Assert
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledTimes(1);
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledWith(
      CWD,
      { ...existingConfig, queriesDirectory: DEFAULT_CONFIG.queriesDirectory },
      existingConfig
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should return without writing when the user answers no', async () => {
    // Arrange
    questionSetConfigurationValueToDefaultConfirmation.mockReturnValueOnce(
      Promise.resolve(false)
    );
    const params = getParams('queriesDirectory');

    // Act
    await setToDefaultConfigValue(CWD, params, 0, getExistingConfig());

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      'Exiting because user does not want to change value'
    );
    expect(writeConfigFileAndUpdateGitIgnore).not.toHaveBeenCalled();
  });
});
