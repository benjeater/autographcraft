import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import {
  DEFAULT_CONFIG,
  DATABASE_CHOICES,
  MONGOD_DB_CONNECTION_LIBRARIES,
  DATABASE_CODES,
  MONGO_DB_CONNECTION_LIBRARY,
} from '@autographcraft/core';

// ESM has no automocking, so every prompt this module uses is named
// explicitly. Real prompts would block the test run waiting on stdin.
const confirm =
  jest.fn<
    (config: { message: string; default?: boolean }) => Promise<boolean>
  >();
const input =
  jest.fn<(config: { message: string; default?: string }) => Promise<string>>();
const select =
  jest.fn<(config: { message: string; choices: unknown }) => Promise<string>>();

jest.unstable_mockModule('@inquirer/prompts', () => ({
  confirm,
  input,
  select,
}));

const {
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
} = await import('../questions');

describe('initFunctions/questions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    confirm.mockResolvedValue(true);
    input.mockResolvedValue('user/provided/path');
    select.mockResolvedValue(DATABASE_CODES.MONGO_DB);
  });

  describe('questionOverwriteExistingConfiguration', () => {
    it('should warn about the existing file and default to not overwriting', async () => {
      // Arrange
      confirm.mockResolvedValueOnce(false);

      // Act
      const result = await questionOverwriteExistingConfiguration(
        '/project/autographcraft.config.js'
      );

      // Assert
      expect(result).toBe(false);
      expect(confirm).toHaveBeenCalledWith({
        message:
          'There is already an existing config file for AutoGraphCraft at /project/autographcraft.config.js.\nContinuing with the initialisation will overwrite this file.\nDo you still want to continue?',
        default: false,
      });
    });
  });

  describe('questionUseDefaultConfiguration', () => {
    it('should ask whether to use the default configuration, defaulting to yes', async () => {
      // Act
      const result = await questionUseDefaultConfiguration();

      // Assert
      expect(result).toBe(true);
      expect(confirm).toHaveBeenCalledWith({
        message: 'Would you like to use the default configuration?',
        default: true,
      });
    });
  });

  // Every directory question is the same shape: a free text input prefilled
  // with the matching default from the shipped configuration.
  const directoryQuestions: [string, () => Promise<string>, string, string][] =
    [
      [
        'questionTargetSourceDirectory',
        questionTargetSourceDirectory,
        'Location of the model schemas:',
        DEFAULT_CONFIG.schemaSourceDirectory,
      ],
      [
        'questionTargetModelsDirectory',
        questionTargetModelsDirectory,
        'Location to put the generated resolvers:',
        DEFAULT_CONFIG.generatedModelsDirectory,
      ],
      [
        'questionTargetUtilsDirectory',
        questionTargetUtilsDirectory,
        'Location of generated utils directory:',
        DEFAULT_CONFIG.generatedUtilsDirectory,
      ],
      [
        'questionTargetTypesDirectory',
        questionTargetTypesDirectory,
        'Location of generated types directory:',
        DEFAULT_CONFIG.generatedTypesDirectory,
      ],
      [
        'questionTargetQueriesDirectory',
        questionTargetQueriesDirectory,
        'Location of queries defined in the schema:',
        DEFAULT_CONFIG.queriesDirectory,
      ],
      [
        'questionTargetMutationsDirectory',
        questionTargetMutationsDirectory,
        'Location of mutations defined in the schema:',
        DEFAULT_CONFIG.mutationsDirectory,
      ],
      [
        'questionTargetDatabaseDirectory',
        questionTargetDatabaseDirectory,
        'Location of generated database directory:',
        DEFAULT_CONFIG.generatedDatabaseDirectory,
      ],
      [
        'questionTargetGitIgnorePath',
        questionTargetGitIgnorePath,
        'Location of projects git ignore file:',
        DEFAULT_CONFIG.gitIgnorePath,
      ],
    ];

  it.each(directoryQuestions)(
    '%s should prompt with the matching default and return the answer',
    async (_name, question, message, defaultValue) => {
      // Act
      const result = await question();

      // Assert
      expect(result).toBe('user/provided/path');
      expect(input).toHaveBeenCalledTimes(1);
      expect(input).toHaveBeenCalledWith({ message, default: defaultValue });
    }
  );

  describe('questionDatabaseType', () => {
    it('should offer the supported databases and return the selection', async () => {
      // Arrange
      select.mockResolvedValueOnce(DATABASE_CODES.DYNAMO_DB);

      // Act
      const result = await questionDatabaseType();

      // Assert
      expect(result).toBe(DATABASE_CODES.DYNAMO_DB);
      expect(select).toHaveBeenCalledWith({
        message: 'Select a database to use:',
        choices: DATABASE_CHOICES,
      });
    });
  });

  describe('questionMongoDbConnectionLibrary', () => {
    it('should offer the supported MongoDB libraries and return the selection', async () => {
      // Arrange
      select.mockResolvedValueOnce(MONGO_DB_CONNECTION_LIBRARY.MONGOOSE);

      // Act
      const result = await questionMongoDbConnectionLibrary();

      // Assert
      expect(result).toBe(MONGO_DB_CONNECTION_LIBRARY.MONGOOSE);
      expect(select).toHaveBeenCalledWith({
        message: 'Select a MongoDB connection library to use:',
        choices: MONGOD_DB_CONNECTION_LIBRARIES,
      });
    });
  });
});
