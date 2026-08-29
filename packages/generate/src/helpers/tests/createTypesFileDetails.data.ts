import { join } from 'path';
import {
  DATABASE_CODES,
  TYPE_DEFS_FILE_NAME,
  type AutoGraphCraftConfiguration,
  type OutputFileDetail,
} from '@autographcraft/core';

export const GENERATED_TYPES_DIRECTORY = 'src/generatedTypes';

export const PRINTABLE_SCHEMA = `type Query {
  getUser(id: ID!): User
}

type User {
  id: ID!
  name: String!
}
`;

export function getConfiguration(
  overrides: Partial<AutoGraphCraftConfiguration> = {}
): AutoGraphCraftConfiguration {
  return {
    generatedTypesDirectory: GENERATED_TYPES_DIRECTORY,
    generatedDatabaseDirectory: 'src/generatedDatabase',
    generatedUtilsDirectory: 'src/generatedUtils',
    generatedModelsDirectory: 'src/models',
    queriesDirectory: 'src/generatedQueries',
    mutationsDirectory: 'src/generatedMutations',
    schemaSourceDirectory: 'src/schemas',
    gitIgnorePath: '.gitignore',
    databaseType: DATABASE_CODES.MONGO_DB,
    authorisationStructure: [],
    ...overrides,
  };
}

/**
 * The files as they arrive from the API: POSIX separators and a leading slash.
 */
export function getInputFiles(): OutputFileDetail[] {
  return [
    {
      filePath: '/src/models/User/index.ts',
      content: 'export const user = 1;',
      addIgnoreHeader: false,
      shouldOverwrite: false,
    },
    {
      filePath: `/${GENERATED_TYPES_DIRECTORY}/${TYPE_DEFS_FILE_NAME}`,
      content: PRINTABLE_SCHEMA,
      addIgnoreHeader: true,
      shouldOverwrite: true,
    },
  ];
}

/**
 * The path the printable schema file is expected to be found at once the
 * incoming paths have been normalised for the host platform.
 */
export const PRINTABLE_SCHEMA_PATH = join(
  GENERATED_TYPES_DIRECTORY,
  TYPE_DEFS_FILE_NAME
);
