import { join } from 'path';
import os from 'os';
import { existsSync, readFileSync } from 'node:fs';
import {
  STORED_DETAILS_DIR_NAME,
  LAST_REQUEST_FILE_NAME,
  PROCESS_ARGUMENT_PARAMS,
} from '../../constants';
import type {
  AutoGraphCraftConfiguration,
  MergedTypeDef,
} from '@autographcraft/core';
import { LastRequestStrings } from '../../types';

/**
 * Checks if the current request is the same as the previous request, including
 * if the force flag is set.
 *
 * @param params The command line arguments
 * @param currentConfiguration The current configuration being used
 * @param schema The schema to compare against
 * @returns `true` if the request is the same as the previous request, `false` otherwise
 */
export function checkIfSameAsPreviousRequest(
  params: string[],
  currentConfiguration: AutoGraphCraftConfiguration,
  schema: MergedTypeDef
): boolean {
  if (params.includes(PROCESS_ARGUMENT_PARAMS.FORCE)) {
    return false;
  }

  if (params.includes(PROCESS_ARGUMENT_PARAMS.FORCE_SHORT)) {
    return false;
  }

  const lastRequestStrings = getLastRequestStrings();
  if (!lastRequestStrings) {
    return false;
  }

  const lastRequestConfig = lastRequestStrings.configuration;
  const lastRequestPrintableTypeDefs = lastRequestStrings.printableTypeDefs;

  const currentConfigString = JSON.stringify(currentConfiguration);

  const isSameConfig = currentConfigString === lastRequestConfig;
  const isSameSchema =
    schema.printableTypeDefs === lastRequestPrintableTypeDefs;

  return isSameConfig && isSameSchema;
}

/**
 * Fetches the login details from the login file in the user's home directory
 * and returns them as a LoginDetails object
 *
 * The login.json file will contain multiple login details, each with a unique name.
 */
export function getLastRequestStrings(): LastRequestStrings | null {
  const { homedir } = os.userInfo();
  const filepath = join(
    homedir,
    STORED_DETAILS_DIR_NAME,
    LAST_REQUEST_FILE_NAME
  );

  try {
    if (!existsSync(filepath)) {
      return null;
    }
    const jsonString = readFileSync(filepath, 'utf-8');
    const lastRequestStrings = JSON.parse(jsonString);
    return lastRequestStrings;
  } catch (e) {
    return null;
  }
}
