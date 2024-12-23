import { join } from 'path';
import os from 'os';
import { existsSync, readFileSync } from 'node:fs';
import type { AuthTokens } from '../types';
import { STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME } from '../constants';

/**
 * Fetches the login details from the login file in the user's home directory
 * and returns them as a LoginDetails object
 *
 * The login.json file will contain multiple login details, each with a unique name.
 */
export function getExistingAuthTokens(): AuthTokens | null {
  const { homedir } = os.userInfo();
  const filepath = join(homedir, STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME);

  try {
    if (!existsSync(filepath)) {
      return null;
    }
    const jsonString = readFileSync(filepath, 'utf-8');
    const authTokens = JSON.parse(jsonString);
    return authTokens;
  } catch (e) {
    return null;
  }
}
