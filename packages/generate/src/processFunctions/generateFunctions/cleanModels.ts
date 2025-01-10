import { logger } from '@autographcraft/core';
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'path';
import type {
  AutoGraphCraftConfiguration,
  OutputFileDetail,
} from '@autographcraft/core';

export function cleanModels(
  currentWorkingDirectory: string,
  config: AutoGraphCraftConfiguration,
  allFiles: OutputFileDetail[]
): void {
  logger.info(
    'ℹ️ Deleting existing model directories where the model was not found in the latest schema...'
  );

  const generatedModelsDirectory = join(
    currentWorkingDirectory,
    config.generatedModelsDirectory
  );

  const generatedDatabaseDirectory = join(
    currentWorkingDirectory,
    config.generatedDatabaseDirectory
  );

  const generatedDatabaseConnectionsDirectory = join(
    generatedDatabaseDirectory,
    'databaseConnections'
  );

  const generatedDocumentTypesDirectory = join(
    generatedDatabaseDirectory,
    'databaseDocumentTypes'
  );

  const generatedSchemaDirectory = join(
    generatedDatabaseDirectory,
    'databaseSchemas'
  );

  // Read all the model directories in the generatedModelsDirectory
  const modelDirectories = readdirSync(generatedModelsDirectory, {
    withFileTypes: true,
  })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  // Get all the model names from the generated files
  const modelNames = getAllModelNamesFromFiles(
    allFiles,
    config.generatedModelsDirectory
  );

  // For each model directory, check if the model is in the latest schema
  // If not, delete the directory
  modelDirectories.forEach((modelDirectory) => {
    if (!modelNames.includes(modelDirectory)) {
      const modelNameOnly = modelDirectory.replace('model', '');

      logger.info(`Deleting model directory: ${modelDirectory}`);

      // Remove the model directory
      rmSync(join(generatedModelsDirectory, modelDirectory), {
        recursive: true,
        force: true,
      });

      // Tidy up the database connections directory
      const databaseConnectionFileName = `${modelNameOnly}DatabaseConnection.ts`;
      const databaseConnectionFile = join(
        generatedDatabaseConnectionsDirectory,
        databaseConnectionFileName
      );
      rmSync(databaseConnectionFile, {
        recursive: true,
        force: true,
      });

      // Tidy up the generated database document types directory
      const databaseDocumentTypeFileName = `${modelNameOnly}DatabaseDocumentType.ts`;
      const databaseDocumentTypeFile = join(
        generatedDocumentTypesDirectory,
        databaseDocumentTypeFileName
      );
      rmSync(databaseDocumentTypeFile, {
        recursive: true,
        force: true,
      });

      // Tidy up the generated schema directory
      const databaseSchemaFileName = `${modelNameOnly}DatabaseSchema.ts`;
      const databaseSchemaFile = join(
        generatedSchemaDirectory,
        databaseSchemaFileName
      );
      rmSync(databaseSchemaFile, {
        recursive: true,
        force: true,
      });
    }
  });
}

/**
 * Returns all the unique model names from the generated files
 * @param allFiles The generated files
 * @param generatedModelsDirectory The generated models directory
 * @returns
 */
function getAllModelNamesFromFiles(
  allFiles: OutputFileDetail[],
  generatedModelsDirectory: string
): string[] {
  const modelDirectoryFiles = allFiles.filter((generatedFile) => {
    return generatedFile.filePath.startsWith(generatedModelsDirectory);
  });

  const modelNamesFromAllFiles: string[] = modelDirectoryFiles.map(
    (generatedFile) => {
      const removedGeneratedModelsDirectory = generatedFile.filePath.replace(
        `${generatedModelsDirectory}/`,
        ''
      );
      return removedGeneratedModelsDirectory.split('/')[0];
    }
  );

  return Array.from(new Set(modelNamesFromAllFiles));
}
