#!/usr/bin/env node

import { logger } from '@autographcraft/core';
import { init } from './processFunctions/init';
import { config } from './processFunctions/config';
import { help } from './processFunctions/help';
import { generateAndSave } from './processFunctions/generateAndSave';
import { PROCESS_ARGUMENT_VECTORS } from './constants';
import type { ProcessFunction } from './types';

// FUTURE: Allow the user to force a new login via a flag (for account changing)

export async function main() {
  const params = process.argv.slice(2);
  const currentWorkingDirectory = process.cwd();

  try {
    for (const processArg of PROCESS_ARGUMENT_VECTORS) {
      if (!params.includes(processArg.argument)) {
        continue;
      }
      let processFunctionToRun: ProcessFunction;
      switch (processArg.argument) {
        case 'init':
          processFunctionToRun = init;
          break;
        case 'config':
          processFunctionToRun = config;
          break;
        case 'generate':
          processFunctionToRun = generateAndSave;
          break;
        case 'help':
        default:
          processFunctionToRun = help;
      }

      // If the params include the quiet flag, set the logger to quiet
      if (params.includes('--quiet') || params.includes('-q')) {
        logger.silent = true;
      }

      await processFunctionToRun(currentWorkingDirectory, params);
      logger.end();
      process.exit(0);
    }

    logger.warn(
      `Unknown function requested, possible options are: [${PROCESS_ARGUMENT_VECTORS.map(
        (processArgVector) => processArgVector.argument
      ).join(', ')}]`
    );
    logger.end();
    process.exit(1);
  } catch (err) {
    logger.silent = false;
    logger.error(err);
    logger.end();
    process.exit(1);
  }
}

export default main();
