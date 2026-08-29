import {
  DATABASE_CODES,
  MONGO_DB_CONNECTION_LIBRARY,
} from '@autographcraft/core';

export const CURRENT_WORKING_DIRECTORY = '/virtual/project';

/**
 * A configuration that passes every validation in `getExistingConfiguration`.
 */
export function getValidConfiguration(): Record<string, unknown> {
  return {
    generatedTypesDirectory: 'src/generatedTypes',
    generatedDatabaseDirectory: 'src/generatedDatabase',
    generatedUtilsDirectory: 'src/generatedUtils',
    generatedModelsDirectory: 'src/models',
    queriesDirectory: 'src/generatedQueries',
    mutationsDirectory: 'src/generatedMutations',
    schemaSourceDirectory: 'src/schemas',
    gitIgnorePath: '.gitignore',
    databaseType: DATABASE_CODES.MONGO_DB,
    mongoDbConnectionLibrary: MONGO_DB_CONNECTION_LIBRARY.MONGOOSE,
    authorisationStructure: [],
  };
}

/**
 * Every string field that is validated as "set" and "a string", with the
 * warning each failure produces.
 */
export const STRING_FIELD_CASES: [
  field: string,
  notSetMessage: string,
  notAStringMessage: string,
][] = [
  [
    'generatedTypesDirectory',
    '⚠️ The generated types directory is not set; please fix this',
    '⚠️ The generated types directory is not a string; please fix this',
  ],
  [
    'generatedDatabaseDirectory',
    '⚠️ The generated database directory is not set; please fix this',
    '⚠️ The generated database directory is not a string; please fix this',
  ],
  [
    'generatedUtilsDirectory',
    '⚠️ The generated utils directory is not set; please fix this',
    '⚠️ The generated utils directory is not a string; please fix this',
  ],
  [
    'generatedModelsDirectory',
    '⚠️ The generated models directory is not set; please fix this',
    '⚠️ The generated models directory is not a string; please fix this',
  ],
  [
    'queriesDirectory',
    '⚠️ The queries directory is not set; please fix this',
    '⚠️ The queries directory is not a string; please fix this',
  ],
  [
    'mutationsDirectory',
    '⚠️ The mutations directory is not set; please fix this',
    '⚠️ The mutations directory is not a string; please fix this',
  ],
  [
    'schemaSourceDirectory',
    '⚠️ The schema source directory is not set; please fix this',
    '⚠️ The schema source directory is not a string; please fix this',
  ],
  [
    'gitIgnorePath',
    '⚠️ The git ignore path is not set; please fix this',
    '⚠️ The git ignore path is not a string; please fix this',
  ],
];
