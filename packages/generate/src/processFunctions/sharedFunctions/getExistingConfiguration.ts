import { existsSync } from 'node:fs';
import { join } from 'path';
import {
  logger,
  DATABASE_CODES,
  MONGO_DB_CONNECTION_LIBRARY,
  CONFIG_FILE_NAME,
  type AutoGraphCraftConfiguration,
} from '@autographcraft/core';

/**
 * Fetches the existing configuration from the project
 * @param currentWorkingDirectory The path that the function was executed from
 * @returns The configuration as a parsed object
 */
export async function getExistingConfiguration(
  currentWorkingDirectory: string
): Promise<AutoGraphCraftConfiguration | undefined> {
  const existingConfigurationPath = join(
    currentWorkingDirectory,
    CONFIG_FILE_NAME
  );
  if (!existsSync(existingConfigurationPath)) {
    return undefined;
  }
  const existingConfigContent = await import(existingConfigurationPath);
  const existingConfig = existingConfigContent.default;

  validateGeneratedTypesDirectory(existingConfig);
  validateGeneratedDatabaseDirectory(existingConfig);
  validateGeneratedUtilsDirectory(existingConfig);
  validateGeneratedModelsDirectory(existingConfig);
  validateQueriesDirectory(existingConfig);
  validateMutationsDirectory(existingConfig);
  validateSchemaSourceDirectory(existingConfig);
  validateGitIgnorePath(existingConfig, currentWorkingDirectory);
  validateDatabaseType(existingConfig);
  validateMongoDbConnectionLibrary(existingConfig);
  validateAuthorisationStructure(existingConfig);

  return existingConfig;
}

function validateGeneratedTypesDirectory(
  existingConfig: AutoGraphCraftConfiguration
) {
  if (!existingConfig.generatedTypesDirectory) {
    logger.warn('⚠️ The generated types directory is not set; please fix this');
    process.exit(1);
  }
  if (typeof existingConfig.generatedTypesDirectory !== 'string') {
    logger.warn(
      '⚠️ The generated types directory is not a string; please fix this'
    );
    process.exit(1);
  }
}

function validateGeneratedDatabaseDirectory(
  existingConfig: AutoGraphCraftConfiguration
) {
  if (!existingConfig.generatedDatabaseDirectory) {
    logger.warn(
      '⚠️ The generated database directory is not set; please fix this'
    );
    process.exit(1);
  }
  if (typeof existingConfig.generatedDatabaseDirectory !== 'string') {
    logger.warn(
      '⚠️ The generated database directory is not a string; please fix this'
    );
    process.exit(1);
  }
}

function validateGeneratedUtilsDirectory(
  existingConfig: AutoGraphCraftConfiguration
) {
  if (!existingConfig.generatedUtilsDirectory) {
    logger.warn('⚠️ The generated utils directory is not set; please fix this');
    process.exit(1);
  }
  if (typeof existingConfig.generatedUtilsDirectory !== 'string') {
    logger.warn(
      '⚠️ The generated utils directory is not a string; please fix this'
    );
    process.exit(1);
  }
}

function validateGeneratedModelsDirectory(
  existingConfig: AutoGraphCraftConfiguration
) {
  if (!existingConfig.generatedModelsDirectory) {
    logger.warn(
      '⚠️ The generated models directory is not set; please fix this'
    );
    process.exit(1);
  }
  if (typeof existingConfig.generatedModelsDirectory !== 'string') {
    logger.warn(
      '⚠️ The generated models directory is not a string; please fix this'
    );
    process.exit(1);
  }
}

function validateQueriesDirectory(existingConfig: AutoGraphCraftConfiguration) {
  if (!existingConfig.queriesDirectory) {
    logger.warn('⚠️ The queries directory is not set; please fix this');
    process.exit(1);
  }
  if (typeof existingConfig.queriesDirectory !== 'string') {
    logger.warn('⚠️ The queries directory is not a string; please fix this');
    process.exit(1);
  }
}

function validateMutationsDirectory(
  existingConfig: AutoGraphCraftConfiguration
) {
  if (!existingConfig.mutationsDirectory) {
    logger.warn('⚠️ The mutations directory is not set; please fix this');
    process.exit(1);
  }
  if (typeof existingConfig.mutationsDirectory !== 'string') {
    logger.warn('⚠️ The mutations directory is not a string; please fix this');
    process.exit(1);
  }
}

function validateSchemaSourceDirectory(
  existingConfig: AutoGraphCraftConfiguration
) {
  if (!existingConfig.schemaSourceDirectory) {
    logger.warn('⚠️ The schema source directory is not set; please fix this');
    process.exit(1);
  }
  if (typeof existingConfig.schemaSourceDirectory !== 'string') {
    logger.warn(
      '⚠️ The schema source directory is not a string; please fix this'
    );
    process.exit(1);
  }
}

function validateGitIgnorePath(
  existingConfig: AutoGraphCraftConfiguration,
  currentWorkingDirectory: string
) {
  if (!existingConfig.gitIgnorePath) {
    logger.warn('⚠️ The git ignore path is not set; please fix this');
    process.exit(1);
  }
  if (typeof existingConfig.gitIgnorePath !== 'string') {
    logger.warn('⚠️ The git ignore path is not a string; please fix this');
    process.exit(1);
  }
  if (
    !existsSync(join(currentWorkingDirectory, existingConfig.gitIgnorePath))
  ) {
    logger.warn(
      '⚠️ No file exists at the git ignore path; either create the file or update the path'
    );
    process.exit(1);
  }
}

function validateDatabaseType(existingConfig: AutoGraphCraftConfiguration) {
  if (!existingConfig.databaseType) {
    logger.warn('⚠️ The database type is not set; please fix this');
    process.exit(1);
  }
  if (typeof existingConfig.databaseType !== 'string') {
    logger.warn('⚠️ The database type is not a string; please fix this');
    process.exit(1);
  }
  if (!Object.values(DATABASE_CODES).includes(existingConfig.databaseType)) {
    logger.warn(
      '⚠️ The database type is not a valid database type; please fix this'
    );
    process.exit(1);
  }
}

function validateMongoDbConnectionLibrary(
  existingConfig: AutoGraphCraftConfiguration
) {
  if (!existingConfig.mongoDbConnectionLibrary) {
    return;
  }
  if (typeof existingConfig.mongoDbConnectionLibrary !== 'string') {
    logger.warn(
      '⚠️ The MongoDB connection library is not a string; please fix this'
    );
    process.exit(1);
  }
  if (
    !Object.values(MONGO_DB_CONNECTION_LIBRARY).includes(
      existingConfig.mongoDbConnectionLibrary
    )
  ) {
    logger.warn(
      '⚠️ The database type is not a valid database type; please fix this'
    );
    process.exit(1);
  }
}

function validateAuthorisationStructure(
  existingConfig: AutoGraphCraftConfiguration
) {
  if (!existingConfig.authorisationStructure) {
    return;
  }

  if (!Array.isArray(existingConfig.authorisationStructure)) {
    logger.warn(
      '⚠️ The authorisation structure is not an array; please fix this'
    );
    process.exit(1);
  }
}
