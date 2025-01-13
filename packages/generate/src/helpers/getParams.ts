import yargs from 'yargs/yargs';
import { argv } from 'node:process';
import type { ProcessFunctionParams } from '../types';
import {
  PROCESS_ARGUMENT_PARAMS,
  PROCESS_ARGUMENT_VECTORS,
} from '../constants';

export function getParams(): ProcessFunctionParams {
  const params = yargs(argv.slice(2))
    .command(
      PROCESS_ARGUMENT_VECTORS[0].argument,
      'Initialises the AutoGraphCraft configuration',
      {
        [PROCESS_ARGUMENT_PARAMS.DEFAULT]: {
          type: 'boolean',
          description:
            'Uses the default configuration values when initialising the config',
          alias: PROCESS_ARGUMENT_PARAMS.DEFAULT_SHORT,
        },
      }
    )
    .command(
      PROCESS_ARGUMENT_VECTORS[1].argument,
      'Configures the AutoGraphCraft configuration'
    )
    .command(
      PROCESS_ARGUMENT_VECTORS[3].argument,
      'Generates the models from the schema',
      {
        [PROCESS_ARGUMENT_PARAMS.USERNAME]: {
          type: 'string',
          description: 'Username for the AutoGraphCraft account',
        },
        [PROCESS_ARGUMENT_PARAMS.PASSWORD]: {
          type: 'string',
          description: 'Password for the AutoGraphCraft account',
        },
        [PROCESS_ARGUMENT_PARAMS.FORCE]: {
          type: 'boolean',
          description:
            'Forces the generate command to run even if the schema has not changed',
          alias: PROCESS_ARGUMENT_PARAMS.FORCE_SHORT,
        },
        [PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS]: {
          type: 'boolean',
          description:
            'Cleans the models directory if a model is no longer in the schema',
          alias: PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS_SHORT,
        },
        [PROCESS_ARGUMENT_PARAMS.DRY_RUN]: {
          type: 'boolean',
          description: 'Runs the generate command without writing any files',
          alias: PROCESS_ARGUMENT_PARAMS.DRY_RUN_SHORT,
        },
      }
    )
    .command(PROCESS_ARGUMENT_VECTORS[2].argument, 'Opens the help webpage')
    .options({
      [PROCESS_ARGUMENT_PARAMS.QUIET]: {
        type: 'boolean',
        description: 'Runs the command without any logging',
        alias: PROCESS_ARGUMENT_PARAMS.QUIET_SHORT,
      },
    })
    .parseSync() as ProcessFunctionParams;

  return params;
}
