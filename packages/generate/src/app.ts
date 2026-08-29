#!/usr/bin/env node

import { cwd } from 'node:process';
import { logger } from '@autographcraft/core';
import { init } from './processFunctions/init';
import { config } from './processFunctions/config';
import { help } from './processFunctions/help';
import { generateAndSave } from './processFunctions/generateAndSave';
import { PROCESS_ARGUMENT_PARAMS, PROCESS_ARGUMENT_VECTORS } from './constants';
import type { ProcessFunction } from './types';
import { getParams } from './helpers';

// FUTURE: Allow the user to force a new login via a flag (for account changing)

export async function main() {
  try {
    // Argument parsing and the working directory lookup are inside the
    // try/catch so that a failure in either is reported through the same
    // handler as any other error, rather than escaping `main` as an unhandled
    // rejection with no message and no exit code.
    //
    // `getParams` can also end the process on its own: when `--help` is passed
    // it prints the usage text and calls `process.exit(0)`. That call does not
    // return, so nothing below it runs and the `catch` is never entered — the
    // zero exit code stands. (A test that stubs `process.exit` instead of
    // terminating will fall through to the `catch` and record a follow-up
    // `exit(1)`; the first recorded exit code is the one production uses.)
    const params = getParams();
    const currentWorkingDirectory = cwd();

    for (const processArg of PROCESS_ARGUMENT_VECTORS) {
      if (!params._.includes(processArg.argument)) {
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
      if (
        params[PROCESS_ARGUMENT_PARAMS.QUIET] ||
        params[PROCESS_ARGUMENT_PARAMS.QUIET_SHORT]
      ) {
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

// This module is the package's `bin` entrypoint (see the `bin` field in
// package.json) and carries the `#!/usr/bin/env node` shebang above, so in
// production it is only ever loaded as the module node was started with and
// invoking `main()` on import is exactly what should happen. Guarding the call
// behind a "was I run directly?" check would add a branch that can never be
// false in production solely to make the spec tidier, so the invocation is
// deliberately left as a top-level side effect and the spec resets the module
// registry between cases instead.
export default main();
