import {
  PROCESS_ARGUMENT_VECTOR_CODES,
  type ProcessArgumentVector,
} from '../types';

export const STORED_DETAILS_DIR_NAME = '.autographcraft' as const;
export const TOKEN_FILE_NAME = 'token' as const;
export const LAST_REQUEST_FILE_NAME = 'lastRequest' as const;

export const SIGN_IN_URL = 'https://autographcraft.com/auth/signin' as const;
export const AUTOGRAPHCRAFT_API_URL =
  'https://apiv1.autographcraft.com/graphql' as const;

export const PROCESS_ARGUMENT_VECTORS: ProcessArgumentVector[] = [
  {
    argument: 'init',
    description: 'Creates the config file for AutoGraphCraft',
    code: PROCESS_ARGUMENT_VECTOR_CODES.INIT,
  },
  {
    argument: 'config',
    description: 'Allows users to set configuration values via the CLI',
    code: PROCESS_ARGUMENT_VECTOR_CODES.CONFIG,
  },
  {
    argument: 'help',
    description: 'Logs the help file to the CLI',
    code: PROCESS_ARGUMENT_VECTOR_CODES.HELP,
  },
  {
    argument: 'generate',
    description: 'Generates all the files based on the GraphQL schema files',
    code: PROCESS_ARGUMENT_VECTOR_CODES.GENERATE,
  },
] as const;

export const PROCESS_ARGUMENT_PARAMS = {
  FORCE: 'force',
  FORCE_SHORT: 'f',
  DEFAULT: 'default',
  DEFAULT_SHORT: 'd',
  DRY_RUN: 'dry-run',
  DRY_RUN_SHORT: 'r',
  CLEAN_MODELS: 'clean-models',
  CLEAN_MODELS_SHORT: 'm',
  QUIET: 'quiet',
  QUIET_SHORT: 'q',
  USERNAME: 'username',
  PASSWORD: 'password',
} as const;
