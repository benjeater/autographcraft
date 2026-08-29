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
import { buildParams } from '../../../tests/buildParams';

// ESM has no automocking, so every module this unit reaches for is named
// explicitly and the unit under test is imported after the mocks are
// registered. The real core module is spread so that `DEFAULT_CONFIG` keeps
// its real shape, and only the logger - which writes to a file - is replaced.
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

// `set.ts` does not await this call, so the mock is typed to allow a
// non-promise return; see the dead-guard test below.
const questionSetConfigurationValueConfirmation =
  jest.fn<
    (
      key: AutoGraphCraftConfigurationField,
      value: string
    ) => Promise<boolean> | undefined
  >();

jest.unstable_mockModule('../questions', () => ({
  questionSetConfigurationValueConfirmation,
  questionSetConfigurationValueToDefaultConfirmation: jest.fn(),
}));

const checkThatProvidedValueIsAcceptableToKey =
  jest.fn<(keyToSet: string, valueToSet: string) => boolean>();

jest.unstable_mockModule('../checkThatProvidedValueIsAcceptableToKey', () => ({
  checkThatProvidedValueIsAcceptableToKey,
}));

const { logger, DEFAULT_CONFIG } = await import('@autographcraft/core');
const { setConfigValue } = await import('../set');

const CWD = '/project';

const exitSpy = jest.spyOn(process, 'exit').mockImplementation((): never => {
  throw new Error('process.exit');
});

function getExistingConfig(): AutoGraphCraftConfiguration {
  return { ...DEFAULT_CONFIG };
}

function getParams(key: string, value: string): ProcessFunctionParams {
  return buildParams(['config', 'set', key, value]);
}

describe('setConfigValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    questionSetConfigurationValueConfirmation.mockReturnValue(
      Promise.resolve(true)
    );
    checkThatProvidedValueIsAcceptableToKey.mockReturnValue(true);
  });

  afterAll(() => {
    exitSpy.mockRestore();
  });

  it('should be defined', () => {
    // Assert
    expect(setConfigValue).toBeDefined();
  });

  it('should warn and exit when the key is not part of the configuration', async () => {
    // Arrange
    const params = getParams('notAKey', 'anything');

    // Act / Assert
    await expect(
      setConfigValue(CWD, params, 0, getExistingConfig())
    ).rejects.toThrow('process.exit');
    expect(logger.warn).toHaveBeenCalledWith(
      "Unknown key 'notAKey' provided; please check your command and try again."
    );
    expect(logger.end).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(writeConfigFileAndUpdateGitIgnore).not.toHaveBeenCalled();
  });

  it('should read the key and value from the position after the config argument', async () => {
    // Arrange
    const params = buildParams([
      'npx',
      'config',
      'set',
      'queriesDirectory',
      'src/newQueries',
    ]);

    // Act
    await setConfigValue(CWD, params, 1, getExistingConfig());

    // Assert
    expect(questionSetConfigurationValueConfirmation).toHaveBeenCalledWith(
      'queriesDirectory',
      'src/newQueries'
    );
    expect(checkThatProvidedValueIsAcceptableToKey).toHaveBeenCalledWith(
      'queriesDirectory',
      'src/newQueries'
    );
  });

  it('should exit when the value is not acceptable for the key', async () => {
    // Arrange
    checkThatProvidedValueIsAcceptableToKey.mockReturnValueOnce(false);
    const params = getParams('databaseType', 'NOT_A_DATABASE');

    // Act / Assert
    await expect(
      setConfigValue(CWD, params, 0, getExistingConfig())
    ).rejects.toThrow('process.exit');
    expect(logger.end).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(writeConfigFileAndUpdateGitIgnore).not.toHaveBeenCalled();
  });

  it('should write the configuration with the new value merged in', async () => {
    // Arrange
    const existingConfig = getExistingConfig();
    const params = getParams('generatedModelsDirectory', 'src/newModels');

    // Act
    await setConfigValue(CWD, params, 0, existingConfig);

    // Assert
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledTimes(1);
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledWith(
      CWD,
      { ...existingConfig, generatedModelsDirectory: 'src/newModels' },
      existingConfig
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  // `questionSetConfigurationValueConfirmation` is called without `await`, so
  // in production the guard below always sees a truthy promise and the user's
  // answer is ignored - the configuration is written either way.
  it('should write the configuration even when the user answers no, because the answer is not awaited', async () => {
    // Arrange
    questionSetConfigurationValueConfirmation.mockReturnValueOnce(
      Promise.resolve(false)
    );
    const params = getParams('generatedModelsDirectory', 'src/newModels');

    // Act
    await setConfigValue(CWD, params, 0, getExistingConfig());

    // Assert
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledTimes(1);
    expect(logger.info).not.toHaveBeenCalled();
  });

  // Reaching the guard at all requires a falsy, non-promise answer, which the
  // real (async) question function can never return.
  it('should return without writing when the confirmation answer is falsy', async () => {
    // Arrange
    questionSetConfigurationValueConfirmation.mockReturnValueOnce(undefined);
    const params = getParams('generatedModelsDirectory', 'src/newModels');

    // Act
    await setConfigValue(CWD, params, 0, getExistingConfig());

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      'Exiting because user does not want to change value'
    );
    expect(checkThatProvidedValueIsAcceptableToKey).not.toHaveBeenCalled();
    expect(writeConfigFileAndUpdateGitIgnore).not.toHaveBeenCalled();
  });
});
