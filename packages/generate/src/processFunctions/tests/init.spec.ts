import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { join } from 'path';
import type {
  AutoGraphCraftConfiguration,
  DATABASE_CODES as DATABASE_CODES_TYPE,
  MONGO_DB_CONNECTION_LIBRARY as MONGO_DB_CONNECTION_LIBRARY_TYPE,
} from '@autographcraft/core';
import { PROCESS_ARGUMENT_PARAMS } from '../../constants';
import { buildParams } from '../../tests/buildParams';

// ESM has no automocking, so every module this unit reaches for is named
// explicitly and the unit under test is imported after the mocks are
// registered. The real core module is spread so `DEFAULT_CONFIG` and
// `CONFIG_FILE_NAME` keep their real values; only the file-writing logger is
// replaced.
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

const questionOverwriteExistingConfiguration =
  jest.fn<(configPath: string) => Promise<boolean>>();
const questionUseDefaultConfiguration = jest.fn<() => Promise<boolean>>();
const questionTargetSourceDirectory = jest.fn<() => Promise<string>>();
const questionTargetModelsDirectory = jest.fn<() => Promise<string>>();
const questionTargetUtilsDirectory = jest.fn<() => Promise<string>>();
const questionTargetTypesDirectory = jest.fn<() => Promise<string>>();
const questionTargetQueriesDirectory = jest.fn<() => Promise<string>>();
const questionTargetMutationsDirectory = jest.fn<() => Promise<string>>();
const questionTargetDatabaseDirectory = jest.fn<() => Promise<string>>();
const questionTargetGitIgnorePath = jest.fn<() => Promise<string>>();
const questionDatabaseType = jest.fn<() => Promise<DATABASE_CODES_TYPE>>();
const questionMongoDbConnectionLibrary =
  jest.fn<() => Promise<MONGO_DB_CONNECTION_LIBRARY_TYPE>>();

jest.unstable_mockModule('../initFunctions/questions', () => ({
  questionOverwriteExistingConfiguration,
  questionUseDefaultConfiguration,
  questionTargetSourceDirectory,
  questionTargetModelsDirectory,
  questionTargetUtilsDirectory,
  questionTargetTypesDirectory,
  questionTargetQueriesDirectory,
  questionTargetMutationsDirectory,
  questionTargetDatabaseDirectory,
  questionTargetGitIgnorePath,
  questionDatabaseType,
  questionMongoDbConnectionLibrary,
}));

const additionalQuestionsDatabase = jest.fn<
  (databaseType: DATABASE_CODES_TYPE) => Promise<{
    mongoDbConnectionLibrary?: MONGO_DB_CONNECTION_LIBRARY_TYPE;
  }>
>();

jest.unstable_mockModule(
  '../initFunctions/additionalQuestionsDatabase',
  () => ({
    additionalQuestionsDatabase,
  })
);

const getExistingConfiguration =
  jest.fn<
    (
      currentWorkingDirectory: string
    ) => Promise<AutoGraphCraftConfiguration | undefined>
  >();

jest.unstable_mockModule('../../helpers', () => ({ getExistingConfiguration }));

const writeConfigFileAndUpdateGitIgnore = jest.fn();
const validateAuthConfiguration = jest.fn();

jest.unstable_mockModule('../sharedFunctions', () => ({
  writeConfigFileAndUpdateGitIgnore,
  validateAuthConfiguration,
}));

const { logger, DEFAULT_CONFIG, CONFIG_FILE_NAME, DATABASE_CODES } =
  await import('@autographcraft/core');
const { init } = await import('../init');

const CWD = '/project';
const NO_PARAMS = buildParams(['init']);

describe('init', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getExistingConfiguration.mockResolvedValue(undefined);
    questionOverwriteExistingConfiguration.mockResolvedValue(true);
    questionUseDefaultConfiguration.mockResolvedValue(true);
    questionTargetSourceDirectory.mockResolvedValue('src/mySchemas');
    questionTargetModelsDirectory.mockResolvedValue('src/myModels');
    questionTargetUtilsDirectory.mockResolvedValue('src/myUtils');
    questionTargetTypesDirectory.mockResolvedValue('src/myTypes');
    questionTargetQueriesDirectory.mockResolvedValue('src/myQueries');
    questionTargetMutationsDirectory.mockResolvedValue('src/myMutations');
    questionTargetDatabaseDirectory.mockResolvedValue('src/myDatabase');
    questionTargetGitIgnorePath.mockResolvedValue('.myGitIgnore');
    questionDatabaseType.mockResolvedValue(DATABASE_CODES.MONGO_DB);
    additionalQuestionsDatabase.mockResolvedValue({});
  });

  it('should be defined', () => {
    // Assert
    expect(init).toBeDefined();
  });

  it('should ask about overwriting when a configuration already exists', async () => {
    // Arrange
    getExistingConfiguration.mockResolvedValueOnce({ ...DEFAULT_CONFIG });
    questionOverwriteExistingConfiguration.mockResolvedValueOnce(false);

    // Act
    await init(CWD, NO_PARAMS);

    // Assert
    expect(questionOverwriteExistingConfiguration).toHaveBeenCalledWith(
      join(CWD, CONFIG_FILE_NAME)
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Exiting because existing configuration exists and user does not want to overwrite it'
    );
    expect(questionUseDefaultConfiguration).not.toHaveBeenCalled();
    expect(writeConfigFileAndUpdateGitIgnore).not.toHaveBeenCalled();
  });

  it('should continue past the existing configuration when the user agrees to overwrite', async () => {
    // Arrange
    const existingConfig = { ...DEFAULT_CONFIG };
    getExistingConfiguration.mockResolvedValueOnce(existingConfig);

    // Act
    await init(CWD, NO_PARAMS);

    // Assert
    expect(questionUseDefaultConfiguration).toHaveBeenCalledTimes(1);
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledWith(
      CWD,
      { ...DEFAULT_CONFIG },
      existingConfig
    );
  });

  it('should write the default configuration without asking anything for the default flag', async () => {
    // Arrange
    const params = buildParams(['init'], {
      [PROCESS_ARGUMENT_PARAMS.DEFAULT]: true,
    });

    // Act
    await init(CWD, params);

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      'Creating configuration file with default values'
    );
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledWith(
      CWD,
      { ...DEFAULT_CONFIG },
      undefined
    );
    expect(questionUseDefaultConfiguration).not.toHaveBeenCalled();
  });

  it('should write the default configuration for the short default flag', async () => {
    // Arrange
    const params = buildParams(['init'], {
      [PROCESS_ARGUMENT_PARAMS.DEFAULT_SHORT]: true,
    });

    // Act
    await init(CWD, params);

    // Assert
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledTimes(1);
    expect(questionUseDefaultConfiguration).not.toHaveBeenCalled();
  });

  it('should write the default configuration when the user asks for defaults', async () => {
    // Act
    await init(CWD, NO_PARAMS);

    // Assert
    expect(logger.info).toHaveBeenCalledWith(
      'Creating configuration file with default values'
    );
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledWith(
      CWD,
      { ...DEFAULT_CONFIG },
      undefined
    );
    expect(questionTargetSourceDirectory).not.toHaveBeenCalled();
  });

  it('should write a configuration built from the user answers', async () => {
    // Arrange
    questionUseDefaultConfiguration.mockResolvedValueOnce(false);
    questionDatabaseType.mockResolvedValueOnce(DATABASE_CODES.DYNAMO_DB);

    // Act
    await init(CWD, NO_PARAMS);

    // Assert
    expect(additionalQuestionsDatabase).toHaveBeenCalledWith(
      DATABASE_CODES.DYNAMO_DB
    );
    expect(writeConfigFileAndUpdateGitIgnore).toHaveBeenCalledWith(
      CWD,
      {
        ...DEFAULT_CONFIG,
        generatedTypesDirectory: 'src/myTypes',
        generatedDatabaseDirectory: 'src/myDatabase',
        generatedModelsDirectory: 'src/myModels',
        generatedUtilsDirectory: 'src/myUtils',
        queriesDirectory: 'src/myQueries',
        mutationsDirectory: 'src/myMutations',
        schemaSourceDirectory: 'src/mySchemas',
        gitIgnorePath: '.myGitIgnore',
        databaseType: DATABASE_CODES.DYNAMO_DB,
      },
      undefined
    );
  });

  it('should merge the database specific answers into the configuration', async () => {
    // Arrange
    questionUseDefaultConfiguration.mockResolvedValueOnce(false);
    additionalQuestionsDatabase.mockResolvedValueOnce({
      mongoDbConnectionLibrary: actualCore.MONGO_DB_CONNECTION_LIBRARY.MONGOSH,
    });

    // Act
    await init(CWD, NO_PARAMS);

    // Assert
    const writtenConfig = writeConfigFileAndUpdateGitIgnore.mock
      .calls[0][1] as AutoGraphCraftConfiguration;
    expect(writtenConfig.mongoDbConnectionLibrary).toBe(
      actualCore.MONGO_DB_CONNECTION_LIBRARY.MONGOSH
    );
    expect(writtenConfig.databaseType).toBe(DATABASE_CODES.MONGO_DB);
  });
});
