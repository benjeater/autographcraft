import { getExistingConfiguration, createTypesFileDetails } from '../helpers';
import { logger } from '@autographcraft/core';
import { printStatistics, type PrintStatisticsParams } from './helpers';
import {
  fetchMergedTypeDefs,
  getAuthIdToken,
  getAutoGraphCraftApiResponse,
  writeFilesToFileSystem,
} from '../processFunctions';

export async function generateAndSave(
  currentWorkingDirectory: string,
  params: string[]
): Promise<void> {
  // Start the timer
  const startTime = process.hrtime.bigint();

  // Check if the request is a dry run
  const isDryRun = params.includes('--dry-run');
  if (isDryRun) {
    logger.info('ℹ️ Dry run requested, no files will be written');
  }

  // Get the existing configuration
  const existingConfig = await getExistingConfiguration(
    currentWorkingDirectory
  );
  if (!existingConfig) {
    logger.warn(
      '⚠️ No existing configuration exists, use `init` to create the initial configuration file'
    );
    process.exit(1);
  }

  // Get joined schema
  const schema = await fetchMergedTypeDefs(
    currentWorkingDirectory,
    existingConfig,
    [] // custom scalars
  );

  // Get the auth token to call the API with
  const authIdToken = await getAuthIdToken();

  // Send schema to autographcraft API
  const apiResponse = await getAutoGraphCraftApiResponse(
    authIdToken,
    existingConfig,
    schema.printableTypeDefs
  );

  // Create the types locally
  const typesFiles = await createTypesFileDetails(
    currentWorkingDirectory,
    existingConfig,
    apiResponse
  );

  const allFiles = [...apiResponse.files, ...typesFiles];

  // Save all files to the correct location
  writeFilesToFileSystem(allFiles, isDryRun);

  // Give user some statistics
  const printStatisticsParams: PrintStatisticsParams = {
    outputFiles: allFiles,
    isDryRun,
    startTime,
    verbose: false,
  };
  printStatistics(printStatisticsParams);
}
