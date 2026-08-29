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
  OutputFileDetail,
} from '@autographcraft/core';
import { PROCESS_ARGUMENT_PARAMS } from '../../constants';
import type { AutoGraphCraftApiResponse } from '../../types';
// `MergedTypeDef` is not re-exported from `../../types`, so it comes straight
// from the module that declares it.
import type { MergedTypeDef } from '../../types/MergedTypeDefs';
import {
  getApiResponse,
  getGeneratedFiles,
  getSchema,
  getTypesFiles,
} from './generateAndSave.data';

// ESM has no automocking, so every module this unit reaches for is named
// explicitly and the unit under test is imported after the mocks are
// registered. Everything below either touches the network, the file system or
// the user's home directory, so none of it may run for real.
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
const createTypesFileDetails =
  jest.fn<
    (
      currentWorkingDirectory: string,
      config: AutoGraphCraftConfiguration,
      generatedFiles: OutputFileDetail[]
    ) => Promise<OutputFileDetail[]>
  >();
const getFilesFromResponse = jest.fn<() => Promise<OutputFileDetail[]>>();

jest.unstable_mockModule('../../helpers', () => ({
  getExistingConfiguration,
  createTypesFileDetails,
  getFilesFromResponse,
}));

const checkIfSameAsPreviousRequest = jest.fn<() => boolean>();
const printStatistics = jest.fn();
const savePreviousRequest = jest.fn();
const validateSchema = jest.fn<() => Promise<string>>();

jest.unstable_mockModule('../helpers', () => ({
  checkIfSameAsPreviousRequest,
  printStatistics,
  savePreviousRequest,
  validateSchema,
  ValidationResult: { VALID: 'VALID', INVALID: 'INVALID' },
}));

const getAuthIdToken = jest.fn<() => Promise<string>>();
const getIdTokenUsingUsernameAndPassword =
  jest.fn<(username: string, password: string) => Promise<string>>();
const cleanModels = jest.fn();
const writeFilesToFileSystem = jest.fn();
const getAutoGraphCraftApiResponse =
  jest.fn<
    (
      idToken: string,
      config: AutoGraphCraftConfiguration,
      printableTypeDefs: string
    ) => Promise<AutoGraphCraftApiResponse>
  >();
const fetchMergedTypeDefs =
  jest.fn<
    (
      currentWorkingDirectory: string,
      config: AutoGraphCraftConfiguration,
      customScalars: string[]
    ) => Promise<MergedTypeDef>
  >();

jest.unstable_mockModule('../generateFunctions', () => ({
  getAuthIdToken,
  cleanModels,
  writeFilesToFileSystem,
  getAutoGraphCraftApiResponse,
  getIdTokenUsingUsernameAndPassword,
  fetchMergedTypeDefs,
}));

const { logger, DEFAULT_CONFIG } = await import('@autographcraft/core');
const { generateAndSave } = await import('../generateAndSave');

const CWD = '/project';
const NO_PARAMS = { _: ['generate'] };

const exitSpy = jest.spyOn(process, 'exit').mockImplementation((): never => {
  throw new Error('process.exit');
});

describe('generateAndSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getExistingConfiguration.mockResolvedValue({ ...DEFAULT_CONFIG });
    fetchMergedTypeDefs.mockResolvedValue(getSchema());
    validateSchema.mockResolvedValue('VALID');
    checkIfSameAsPreviousRequest.mockReturnValue(false);
    getAuthIdToken.mockResolvedValue('id-token-from-browser');
    getIdTokenUsingUsernameAndPassword.mockResolvedValue(
      'id-token-from-credentials'
    );
    getAutoGraphCraftApiResponse.mockResolvedValue(getApiResponse());
    getFilesFromResponse.mockResolvedValue(getGeneratedFiles());
    createTypesFileDetails.mockResolvedValue(getTypesFiles());
  });

  afterAll(() => {
    exitSpy.mockRestore();
  });

  it('should be defined', () => {
    // Assert
    expect(generateAndSave).toBeDefined();
  });

  it('should warn and exit when there is no existing configuration', async () => {
    // Arrange
    getExistingConfiguration.mockResolvedValueOnce(undefined);

    // Act / Assert
    await expect(generateAndSave(CWD, NO_PARAMS)).rejects.toThrow(
      'process.exit'
    );
    expect(logger.warn).toHaveBeenCalledWith(
      '⚠️ No existing configuration exists, use `init` to create the initial configuration file'
    );
    expect(logger.end).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(fetchMergedTypeDefs).not.toHaveBeenCalled();
  });

  it('should exit when the schema fails validation', async () => {
    // Arrange
    validateSchema.mockResolvedValueOnce('INVALID');

    // Act / Assert
    await expect(generateAndSave(CWD, NO_PARAMS)).rejects.toThrow(
      'process.exit'
    );
    expect(logger.end).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(checkIfSameAsPreviousRequest).not.toHaveBeenCalled();
  });

  it('should stop before calling the API when nothing has changed', async () => {
    // Arrange
    checkIfSameAsPreviousRequest.mockReturnValueOnce(true);

    // Act
    await generateAndSave(CWD, NO_PARAMS);

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      "ℹ️  No changes detected, no files will be written. Use '--force' or '-f' to force a new generation"
    );
    expect(getAutoGraphCraftApiResponse).not.toHaveBeenCalled();
    expect(writeFilesToFileSystem).not.toHaveBeenCalled();
  });

  it('should generate and write the files returned by the API', async () => {
    // Arrange
    const existingConfig = { ...DEFAULT_CONFIG };
    getExistingConfiguration.mockResolvedValueOnce(existingConfig);
    const schema = getSchema();
    fetchMergedTypeDefs.mockResolvedValueOnce(schema);

    // Act
    await generateAndSave(CWD, NO_PARAMS);

    // Assert
    expect(fetchMergedTypeDefs).toHaveBeenCalledWith(CWD, existingConfig, []);
    expect(getAutoGraphCraftApiResponse).toHaveBeenCalledWith(
      'id-token-from-browser',
      existingConfig,
      schema.printableTypeDefs
    );
    expect(createTypesFileDetails).toHaveBeenCalledWith(
      CWD,
      existingConfig,
      getGeneratedFiles()
    );
    expect(writeFilesToFileSystem).toHaveBeenCalledWith(
      [...getGeneratedFiles(), ...getTypesFiles()],
      undefined
    );
    expect(savePreviousRequest).toHaveBeenCalledWith(existingConfig, schema);
    expect(cleanModels).not.toHaveBeenCalled();
  });

  it('should announce a dry run and pass the flag on to the file writer', async () => {
    // Arrange
    const params = { _: ['generate'], [PROCESS_ARGUMENT_PARAMS.DRY_RUN]: true };

    // Act
    await generateAndSave(CWD, params);

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      'ℹ️  Dry run requested, no files will be written'
    );
    expect(writeFilesToFileSystem).toHaveBeenCalledWith(
      expect.any(Array),
      true
    );
  });

  it('should treat the short dry run flag the same way', async () => {
    // Arrange
    const params = {
      _: ['generate'],
      [PROCESS_ARGUMENT_PARAMS.DRY_RUN_SHORT]: true,
    };

    // Act
    await generateAndSave(CWD, params);

    // Assert
    expect(writeFilesToFileSystem).toHaveBeenCalledWith(
      expect.any(Array),
      true
    );
    expect(printStatistics).toHaveBeenCalledWith(
      expect.objectContaining({ isDryRun: true })
    );
  });

  it('should authenticate with the username and password when both are provided', async () => {
    // Arrange
    const params = {
      _: ['generate'],
      [PROCESS_ARGUMENT_PARAMS.USERNAME]: 'user@example.com',
      [PROCESS_ARGUMENT_PARAMS.PASSWORD]: 'hunter2',
    };

    // Act
    await generateAndSave(CWD, params);

    // Assert
    expect(getIdTokenUsingUsernameAndPassword).toHaveBeenCalledWith(
      'user@example.com',
      'hunter2'
    );
    expect(getAuthIdToken).not.toHaveBeenCalled();
    expect(getAutoGraphCraftApiResponse).toHaveBeenCalledWith(
      'id-token-from-credentials',
      expect.anything(),
      expect.any(String)
    );
  });

  it('should fall back to the browser login when only the username is provided', async () => {
    // Arrange
    const params = {
      _: ['generate'],
      [PROCESS_ARGUMENT_PARAMS.USERNAME]: 'user@example.com',
    };

    // Act
    await generateAndSave(CWD, params);

    // Assert
    expect(getIdTokenUsingUsernameAndPassword).not.toHaveBeenCalled();
    expect(getAuthIdToken).toHaveBeenCalledTimes(1);
  });

  it('should log every warning returned by the API', async () => {
    // Arrange
    const apiResponse = getApiResponse();
    apiResponse.warnings = ['first problem', 'second problem'];
    getAutoGraphCraftApiResponse.mockResolvedValueOnce(apiResponse);

    // Act
    await generateAndSave(CWD, NO_PARAMS);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith('⚠️ Warning: first problem');
    expect(logger.warn).toHaveBeenCalledWith('⚠️ Warning: second problem');
  });

  it('should clean the models when the clean models flag is provided', async () => {
    // Arrange
    const existingConfig = { ...DEFAULT_CONFIG };
    getExistingConfiguration.mockResolvedValueOnce(existingConfig);
    const params = {
      _: ['generate'],
      [PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS]: true,
    };

    // Act
    await generateAndSave(CWD, params);

    // Assert
    expect(cleanModels).toHaveBeenCalledWith(CWD, existingConfig, [
      ...getGeneratedFiles(),
      ...getTypesFiles(),
    ]);
  });

  it('should clean the models for the short clean models flag', async () => {
    // Arrange
    const params = {
      _: ['generate'],
      [PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS_SHORT]: true,
    };

    // Act
    await generateAndSave(CWD, params);

    // Assert
    expect(cleanModels).toHaveBeenCalledTimes(1);
  });

  it('should print the statistics for the generated files', async () => {
    // Act
    await generateAndSave(CWD, NO_PARAMS);

    // Assert
    expect(printStatistics).toHaveBeenCalledTimes(1);
    expect(printStatistics).toHaveBeenCalledWith({
      outputFiles: [...getGeneratedFiles(), ...getTypesFiles()],
      isDryRun: undefined,
      startTime: expect.any(BigInt),
    });
  });
});
