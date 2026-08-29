import {
  jest,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import type { ProcessFunctionParams } from '../../types';
import { buildParams } from '../../tests/buildParams';

// ESM has no automocking, so every module this unit reaches for is named
// explicitly and the unit under test is imported after the mocks are
// registered. The real logger writes to a file, so it is replaced.
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

const getExistingConfiguration =
  jest.fn<
    (
      currentWorkingDirectory: string
    ) => Promise<AutoGraphCraftConfiguration | undefined>
  >();

jest.unstable_mockModule('../../helpers', () => ({ getExistingConfiguration }));

// Typed with the real signatures so `toHaveBeenCalledWith` is checked against
// the arguments `config` is actually expected to forward.
type ConfigFunction = (
  currentWorkingDirectory: string,
  params: ProcessFunctionParams,
  paramIndexConfig: number,
  existingConfig: AutoGraphCraftConfiguration
) => Promise<void>;

const setConfigValue = jest.fn<ConfigFunction>();
const setToDefaultConfigValue = jest.fn<ConfigFunction>();

jest.unstable_mockModule('../configFunctions', () => ({
  setConfigValue,
  setToDefaultConfigValue,
}));

const { logger, DEFAULT_CONFIG } = await import('@autographcraft/core');
const { config } = await import('../config');

const CWD = '/project';

const exitSpy = jest.spyOn(process, 'exit').mockImplementation((): never => {
  throw new Error('process.exit');
});

describe('config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getExistingConfiguration.mockResolvedValue({ ...DEFAULT_CONFIG });
    setConfigValue.mockResolvedValue(undefined);
    setToDefaultConfigValue.mockResolvedValue(undefined);
  });

  afterAll(() => {
    exitSpy.mockRestore();
  });

  it('should be defined', () => {
    // Assert
    expect(config).toBeDefined();
  });

  it('should warn and exit when there is no existing configuration', async () => {
    // Arrange
    getExistingConfiguration.mockResolvedValueOnce(undefined);
    const params = buildParams(['config', 'set']);

    // Act / Assert
    await expect(config(CWD, params)).rejects.toThrow('process.exit');
    expect(getExistingConfiguration).toHaveBeenCalledWith(CWD);
    expect(logger.warn).toHaveBeenCalledWith(
      'No existing configuration exists, use `init` to create the initial configuration file'
    );
    expect(logger.end).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(setConfigValue).not.toHaveBeenCalled();
    expect(setToDefaultConfigValue).not.toHaveBeenCalled();
  });

  it('should warn and do nothing when the function after config is unknown', async () => {
    // Arrange
    const params = buildParams(['config', 'unset']);

    // Act
    await config(CWD, params);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      "Unknown function following 'config', expected one of: set, setToDefault"
    );
    expect(setConfigValue).not.toHaveBeenCalled();
    expect(setToDefaultConfigValue).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should warn when no function follows config at all', async () => {
    // Arrange
    const params = buildParams(['config']);

    // Act
    await config(CWD, params);

    // Assert
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(setConfigValue).not.toHaveBeenCalled();
    expect(setToDefaultConfigValue).not.toHaveBeenCalled();
  });

  it('should delegate to setConfigValue for the set function', async () => {
    // Arrange
    const existingConfig = { ...DEFAULT_CONFIG };
    getExistingConfiguration.mockResolvedValueOnce(existingConfig);
    const params = buildParams([
      'npx',
      'config',
      'set',
      'queriesDirectory',
      'src/newQueries',
    ]);

    // Act
    await config(CWD, params);

    // Assert
    expect(logger.warn).not.toHaveBeenCalled();
    expect(setConfigValue).toHaveBeenCalledTimes(1);
    expect(setConfigValue).toHaveBeenCalledWith(CWD, params, 1, existingConfig);
    expect(setToDefaultConfigValue).not.toHaveBeenCalled();
  });

  it('should delegate to setToDefaultConfigValue for the setToDefault function', async () => {
    // Arrange
    const existingConfig = { ...DEFAULT_CONFIG };
    getExistingConfiguration.mockResolvedValueOnce(existingConfig);
    const params = buildParams(['config', 'setToDefault', 'queriesDirectory']);

    // Act
    await config(CWD, params);

    // Assert
    expect(logger.warn).not.toHaveBeenCalled();
    expect(setToDefaultConfigValue).toHaveBeenCalledTimes(1);
    expect(setToDefaultConfigValue).toHaveBeenCalledWith(
      CWD,
      params,
      0,
      existingConfig
    );
    expect(setConfigValue).not.toHaveBeenCalled();
  });
});
