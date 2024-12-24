import {
  PROCESS_ARGUMENT_VECTOR_CODES,
  type ProcessArgumentVector,
} from '../types';

export const STORED_DETAILS_DIR_NAME = '.autographcraft' as const;
export const TOKEN_FILE_NAME = 'token' as const;

export const SIGN_IN_URL = 'https://autographcraft.com/auth/signin' as const;
export const AUTOGRAPHCRAFT_API_URL =
  'https://api.autographcraft.com/graphql' as const;

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
