import { join } from 'path';
import os from 'os';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import type { AuthTokens } from '../types';
import { STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME } from '../constants';

/**
 * Writes the auth tokens to the tokens file for later use
 * @param authTokens - The auth tokens to write to the file
 */
export function writeAuthTokens(authTokens: AuthTokens): void {
  const { homedir } = os.userInfo();
  const filepath = join(homedir, STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME);

  try {
    if (!existsSync(join(homedir, STORED_DETAILS_DIR_NAME))) {
      mkdirSync(join(homedir, STORED_DETAILS_DIR_NAME), { recursive: true });
    }
    writeFileSync(filepath, JSON.stringify(authTokens, null, 2));
  } catch (e) {
    throw new Error(`Error writing auth tokens: ${e}`);
  }
}
