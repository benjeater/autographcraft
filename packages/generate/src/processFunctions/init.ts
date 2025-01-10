import { join } from 'path';

import { logger, CONFIG_FILE_NAME, DEFAULT_CONFIG } from '@autographcraft/core';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import {
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
} from './initFunctions/questions';
import { getExistingConfiguration } from '../helpers';
import { writeConfigFileAndUpdateGitIgnore } from './sharedFunctions';
import { additionalQuestionsDatabase } from './initFunctions/additionalQuestionsDatabase';
import { PROCESS_ARGUMENT_PARAMS } from '../constants';

/**
 * Initialises the application by adding asking the user questions,
 * creating the config file, and updating the git ignore file with the
 * generated files to be ignored.
 *
 * @param currentWorkingDirectory The path that the function was executed from
 * @param params The user provided params to the function call
 */
export async function init(
  currentWorkingDirectory: string,
  params: string[]
): Promise<void> {
  const configPath = join(currentWorkingDirectory, CONFIG_FILE_NAME);

  const existingConfig = await getExistingConfiguration(
    currentWorkingDirectory
  );

  // If the configPath is already populated, ask user if they want to overwrite it
  if (existingConfig) {
    const answerOverwriteExistingConfiguration =
      await questionOverwriteExistingConfiguration(configPath);

    if (!answerOverwriteExistingConfiguration) {
      logger.info(
        'Exiting because existing configuration exists and user does not want to overwrite it'
      );
      return;
    }
  }

  // Get a copy of the default config file
  const newConfig = { ...DEFAULT_CONFIG };

  // Check if the defaults flag has been provided
  if (
    params.includes(PROCESS_ARGUMENT_PARAMS.DEFAULT) ||
    params.includes(PROCESS_ARGUMENT_PARAMS.DEFAULT_SHORT)
  ) {
    logger.info('Creating configuration file with default values');
    writeConfigFileAndUpdateGitIgnore(
      currentWorkingDirectory,
      newConfig,
      existingConfig
    );
    return;
  }

  // Ask the user any questions required to populate the config file
  const answerUseDefaultConfiguration = await questionUseDefaultConfiguration();
  if (answerUseDefaultConfiguration) {
    logger.info('Creating configuration file with default values');
    writeConfigFileAndUpdateGitIgnore(
      currentWorkingDirectory,
      newConfig,
      existingConfig
    );
    return;
  }

  // Populate the user provided values in the config object
  const userProvidedSourceDirectory = await questionTargetSourceDirectory();
  const userProvidedModelsDirectory = await questionTargetModelsDirectory();
  const userProvidedUtilsDirectory = await questionTargetUtilsDirectory();
  const userProvidedTypesDirectory = await questionTargetTypesDirectory();
  const userProvidedQueriesDirectory = await questionTargetQueriesDirectory();
  const userProvidedMutationsDirectory =
    await questionTargetMutationsDirectory();
  const userProvidedDatabaseDirectory = await questionTargetDatabaseDirectory();
  const userProvidedGitIgnorePath = await questionTargetGitIgnorePath();
  const userProvidedDatabaseType = await questionDatabaseType();

  // Ask further questions based on the database type
  const databaseSpecificQuestions = await additionalQuestionsDatabase(
    userProvidedDatabaseType
  );

  const modifiedConfig: AutoGraphCraftConfiguration = {
    ...DEFAULT_CONFIG,
    generatedTypesDirectory: userProvidedTypesDirectory,
    generatedDatabaseDirectory: userProvidedDatabaseDirectory,
    generatedModelsDirectory: userProvidedModelsDirectory,
    generatedUtilsDirectory: userProvidedUtilsDirectory,
    queriesDirectory: userProvidedQueriesDirectory,
    mutationsDirectory: userProvidedMutationsDirectory,
    schemaSourceDirectory: userProvidedSourceDirectory,
    gitIgnorePath: userProvidedGitIgnorePath,
    databaseType: userProvidedDatabaseType,
    ...databaseSpecificQuestions,
  };

  // Save the config file to the CWD
  writeConfigFileAndUpdateGitIgnore(
    currentWorkingDirectory,
    modifiedConfig,
    existingConfig
  );
}
