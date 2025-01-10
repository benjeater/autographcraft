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

  // Read all the model directories in the generatedModelsDirectory from the configuration
  const generatedModelsDirectory = join(
    currentWorkingDirectory,
    config.generatedModelsDirectory
  );

  // Get all the model directories
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
      logger.info(`Deleting model directory: ${modelDirectory}`);
      // Remove the model directory
      rmSync(join(generatedModelsDirectory, modelDirectory), {
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
