import { confirm, input, select } from '@inquirer/prompts';
import {
  DATABASE_CODES,
  MONGO_DB_CONNECTION_LIBRARY,
  DEFAULT_CONFIG,
  DATABASE_CHOICES,
  MONGOD_DB_CONNECTION_LIBRARIES,
} from '@autographcraft/core';

export async function questionOverwriteExistingConfiguration(
  configPath: string
): Promise<boolean> {
  const answerUseDefaultConfiguration = await confirm({
    message: `There is already an existing config file for AutoGraphCraft at ${configPath}.\nContinuing with the initialisation will overwrite this file.\nDo you still want to continue?`,
    default: false,
  });
  return answerUseDefaultConfiguration;
}

export async function questionUseDefaultConfiguration(): Promise<boolean> {
  const answerUseDefaultConfiguration = await confirm({
    message: `Would you like to use the default configuration?`,
    default: true,
  });
  return answerUseDefaultConfiguration;
}

export async function questionTargetSourceDirectory(): Promise<string> {
  const answerTargetSourceDirectory = await input({
    message: 'Location of the model schemas:',
    default: DEFAULT_CONFIG.schemaSourceDirectory,
  });
  return answerTargetSourceDirectory;
}

export async function questionTargetModelsDirectory(): Promise<string> {
  const answerTargetModelsDirectory = await input({
    message: 'Location to put the generated resolvers:',
    default: DEFAULT_CONFIG.generatedModelsDirectory,
  });
  return answerTargetModelsDirectory;
}

export async function questionTargetUtilsDirectory(): Promise<string> {
  const answerTargetUtilsDirectory = await input({
    message: 'Location of generated utils directory:',
    default: DEFAULT_CONFIG.generatedUtilsDirectory,
  });
  return answerTargetUtilsDirectory;
}

export async function questionTargetTypesDirectory(): Promise<string> {
  const answerTargetTypesDirectory = await input({
    message: 'Location of generated types directory:',
    default: DEFAULT_CONFIG.generatedTypesDirectory,
  });
  return answerTargetTypesDirectory;
}

export async function questionTargetQueriesDirectory(): Promise<string> {
  const answerTargetQueriesDirectory = await input({
    message: 'Location of queries defined in the schema:',
    default: DEFAULT_CONFIG.queriesDirectory,
  });
  return answerTargetQueriesDirectory;
}

export async function questionTargetMutationsDirectory(): Promise<string> {
  const answerTargetMutationsDirectory = await input({
    message: 'Location of mutations defined in the schema:',
    default: DEFAULT_CONFIG.mutationsDirectory,
  });
  return answerTargetMutationsDirectory;
}

export async function questionTargetDatabaseDirectory(): Promise<string> {
  const answerTargetDatabaseDirectory = await input({
    message: 'Location of generated database directory:',
    default: DEFAULT_CONFIG.generatedDatabaseDirectory,
  });
  return answerTargetDatabaseDirectory;
}

export async function questionTargetGitIgnorePath(): Promise<string> {
  const answerTargetGitIgnorePath = await input({
    message: 'Location of projects git ignore file:',
    default: DEFAULT_CONFIG.gitIgnorePath,
  });
  return answerTargetGitIgnorePath;
}

export async function questionDatabaseType(): Promise<DATABASE_CODES> {
  const answerDatabaseType = await select({
    message: `Select a database to use:`,
    choices: DATABASE_CHOICES,
  });
  return answerDatabaseType;
}

export async function questionMongoDbConnectionLibrary(): Promise<MONGO_DB_CONNECTION_LIBRARY> {
  const answerMongoDbConnectionLibrary = await select({
    message: `Select a MongoDB connection library to use:`,
    choices: MONGOD_DB_CONNECTION_LIBRARIES,
  });
  return answerMongoDbConnectionLibrary;
}
