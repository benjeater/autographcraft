import { join } from 'path';
import os from 'os';
import { writeFileSync } from 'node:fs';
import {
  STORED_DETAILS_DIR_NAME,
  LAST_REQUEST_FILE_NAME,
} from '../../constants';
import { LastRequestStrings } from '../../types';

import type {
  AutoGraphCraftConfiguration,
  MergedTypeDef,
} from '@autographcraft/core';

/**
 * Stores the current request in a file in the user's home directory
 * @param currentConfiguration The existing configuration
 * @param schema The schema to save
 */
export function savePreviousRequest(
  currentConfiguration: AutoGraphCraftConfiguration,
  schema: MergedTypeDef
): void {
  const { homedir } = os.userInfo();
  const filepath = join(
    homedir,
    STORED_DETAILS_DIR_NAME,
    LAST_REQUEST_FILE_NAME
  );

  const fileContentJson: LastRequestStrings = {
    configuration: JSON.stringify(currentConfiguration),
    printableTypeDefs: schema.printableTypeDefs,
  };

  try {
    writeFileSync(filepath, JSON.stringify(fileContentJson));
  } catch (error) {
    console.error(`Error saving previous request: ${error}`);
  }
}
