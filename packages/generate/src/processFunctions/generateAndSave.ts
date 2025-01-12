import {
  getExistingConfiguration,
  createTypesFileDetails,
  getFilesFromResponse,
} from '../helpers';
import { logger } from '@autographcraft/core';
import {
  checkIfSameAsPreviousRequest,
  printStatistics,
  savePreviousRequest,
  validateSchema,
  ValidationResult,
  type PrintStatisticsParams,
} from './helpers';
import {
  getAuthIdToken,
  cleanModels,
  writeFilesToFileSystem,
  getAutoGraphCraftApiResponse,
  fetchMergedTypeDefs,
} from './generateFunctions';
import { PROCESS_ARGUMENT_PARAMS } from '../constants';
import type { ProcessFunctionParams } from '../types';

export async function generateAndSave(
  currentWorkingDirectory: string,
  params: ProcessFunctionParams
): Promise<void> {
  // Check if the request is a dry run
  const isDryRun = (params[PROCESS_ARGUMENT_PARAMS.DRY_RUN] ||
    params[PROCESS_ARGUMENT_PARAMS.DRY_RUN_SHORT]) as boolean;
  if (isDryRun) {
    logger.info('ℹ️  Dry run requested, no files will be written');
  }

  // Get the existing configuration
  const existingConfig = await getExistingConfiguration(
    currentWorkingDirectory
  );
  if (!existingConfig) {
    logger.warn(
      '⚠️ No existing configuration exists, use `init` to create the initial configuration file'
    );
    logger.end();
    process.exit(1);
  }

  // Get joined schema
  const schema = await fetchMergedTypeDefs(
    currentWorkingDirectory,
    existingConfig,
    [] // custom scalars
  );

  // Validate the schema
  const validateResult = await validateSchema(schema);
  if (validateResult === ValidationResult.INVALID) {
    logger.end();
    process.exit(1);
  }

  // Check if this request is the same as the previous request
  const isSameAsPreviousRequest = checkIfSameAsPreviousRequest(
    params,
    existingConfig,
    schema
  );
  if (isSameAsPreviousRequest) {
    logger.info(
      `ℹ️  No changes detected, no files will be written. Use '--${PROCESS_ARGUMENT_PARAMS.FORCE}' or '-${PROCESS_ARGUMENT_PARAMS.FORCE_SHORT}' to force a new generation`
    );
    return;
  }

  // Get the auth token to call the API with
  const authIdToken = await getAuthIdToken(params);

  // Start the timer
  const startTime = process.hrtime.bigint();

  // Send schema to autographcraft API
  const apiResponse = await getAutoGraphCraftApiResponse(
    authIdToken,
    existingConfig,
    schema.printableTypeDefs
  );

  // Get the files from the signed URL or files key in the API response
  const files = await getFilesFromResponse(apiResponse);

  // Create the types locally
  const typesFiles = await createTypesFileDetails(
    currentWorkingDirectory,
    existingConfig,
    files
  );

  const allFiles = [...files, ...typesFiles];

  // Save all files to the correct location
  writeFilesToFileSystem(allFiles, isDryRun);

  // Write the last request to the file system
  savePreviousRequest(existingConfig, schema);

  // Print out any warnings from the API response
  if (apiResponse.warnings.length > 0) {
    apiResponse.warnings.forEach((warning) => {
      logger.warn(`⚠️ Warning: ${warning}`);
    });
  }

  // If the param to delete existing models is present, delete the existing models
  const shouldCleanModels =
    params[PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS] ||
    params[PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS_SHORT];

  if (shouldCleanModels) {
    cleanModels(currentWorkingDirectory, existingConfig, allFiles);
  }

  // Give user some statistics
  const printStatisticsParams: PrintStatisticsParams = {
    outputFiles: allFiles,
    isDryRun,
    startTime,
    verbose: false,
  };
  printStatistics(printStatisticsParams);
}
