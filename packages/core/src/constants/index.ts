import {
  type AutoGraphCraftConfiguration,
  DatabaseChoice,
  DATABASE_CODES,
  ScalarDetail,
  PossibleFilters,
  MongoDbLibraryChoice,
  MONGO_DB_CONNECTION_LIBRARY,
} from '../types';

export const AUTH_FOLDER_NAME = 'auths';
export const RESOLVER_FOLDER_NAME = 'resolvers';
export const TYPESCRIPT_TYPES_FILE_NAME = 'typescriptTypes';
export const TYPE_DEFS_FILE_NAME = 'typedefs.graphql';
export const HOOK_INS_DIRECTORY_NAME = 'hookIns';

export const DEFAULT_CONFIG: AutoGraphCraftConfiguration = {
  generatedTypesDirectory: 'src/generatedTypes',
  generatedDatabaseDirectory: 'src/generatedDatabase',
  generatedUtilsDirectory: 'src/generatedUtils',
  generatedModelsDirectory: 'src/models',
  queriesDirectory: 'src/generatedQueries',
  mutationsDirectory: 'src/generatedMutations',
  schemaSourceDirectory: 'src/schemas',
  gitIgnorePath: '.gitIgnore',
  databaseType: DATABASE_CODES.MONGO_DB,
  mongoDbConnectionLibrary: MONGO_DB_CONNECTION_LIBRARY.MONGOOSE,
  authorisationStructure: [],
} as const;

export const GIT_IGNORE_LABEL: string =
  '# AuthGraphCraft Generated Folders' as const;

export const CONFIG_FILE_NAME: string = 'autographcraft.config.js' as const;

export const DATABASE_CHOICES: DatabaseChoice[] = [
  {
    name: 'MongoDB',
    description:
      'MongoDB is a source-available, cross-platform, document-oriented database program',
    value: DATABASE_CODES.MONGO_DB,
    disabled: false,
  },
  {
    name: 'DynamoDB',
    description:
      'Amazon DynamoDB is a serverless, NoSQL database service that allows you to develop modern applications at any scale.',
    value: DATABASE_CODES.DYNAMO_DB,
    disabled: 'Coming soon',
  },
  {
    name: 'PostgreSQL',
    description:
      'PostgreSQL also known as Postgres, is a free and open-source relational database management system (RDBMS) emphasizing extensibility and SQL compliance.',
    value: DATABASE_CODES.POSTGRESQL,
    disabled: 'Coming soon',
  },
];

export const MONGOD_DB_CONNECTION_LIBRARIES: MongoDbLibraryChoice[] = [
  {
    name: 'Mongoose',
    description:
      'Mongoose provides a straight-forward, schema-based solution to model your application data. It includes built-in type casting, validation, query building, business logic hooks and more, out of the box.',
    value: MONGO_DB_CONNECTION_LIBRARY.MONGOOSE,
    disabled: false,
  },
  {
    name: 'MongoDB Shell',
    description:
      'The MongoDB Shell, mongosh, is a JavaScript and Node.js REPL environment for interacting with MongoDB deployments in Atlas, locally, or on another remote host.',
    value: MONGO_DB_CONNECTION_LIBRARY.MONGOSH,
    disabled: 'Coming soon',
  },
];

export const DEFAULT_SCALARS: ScalarDetail[] = [
  {
    scalarName: 'ID',
    javascriptType: 'string',
    filtersAvailable: [
      PossibleFilters.eq,
      PossibleFilters.ne,
      PossibleFilters.le,
      PossibleFilters.lt,
      PossibleFilters.ge,
      PossibleFilters.gt,
      PossibleFilters.in,
      PossibleFilters.notIn,
      PossibleFilters.between,
      PossibleFilters.exists,
    ],
  },
  {
    scalarName: 'Int',
    javascriptType: 'number',
    filtersAvailable: [
      PossibleFilters.eq,
      PossibleFilters.ne,
      PossibleFilters.le,
      PossibleFilters.lt,
      PossibleFilters.ge,
      PossibleFilters.gt,
      PossibleFilters.in,
      PossibleFilters.notIn,
      PossibleFilters.between,
      PossibleFilters.exists,
    ],
  },
  {
    scalarName: 'Float',
    javascriptType: 'number',
    filtersAvailable: [
      PossibleFilters.eq,
      PossibleFilters.ne,
      PossibleFilters.le,
      PossibleFilters.lt,
      PossibleFilters.ge,
      PossibleFilters.gt,
      PossibleFilters.in,
      PossibleFilters.notIn,
      PossibleFilters.between,
      PossibleFilters.exists,
    ],
  },
  {
    scalarName: 'String',
    javascriptType: 'string',
    filtersAvailable: [
      PossibleFilters.eq,
      PossibleFilters.ne,
      PossibleFilters.le,
      PossibleFilters.lt,
      PossibleFilters.ge,
      PossibleFilters.gt,
      PossibleFilters.in,
      PossibleFilters.notIn,
      PossibleFilters.startsWith,
      PossibleFilters.between,
      PossibleFilters.exists,
    ],
  },
  {
    scalarName: 'Boolean',
    javascriptType: 'boolean',
    filtersAvailable: [
      PossibleFilters.eq,
      PossibleFilters.ne,
      PossibleFilters.exists,
    ],
  },
];

export const PACKAGE_SCALARS: ScalarDetail[] = [
  {
    scalarName: 'ISO8601DateTime',
    javascriptType: 'Date',
    filtersAvailable: [
      PossibleFilters.eq,
      PossibleFilters.ne,
      PossibleFilters.le,
      PossibleFilters.lt,
      PossibleFilters.ge,
      PossibleFilters.gt,
      PossibleFilters.between,
      PossibleFilters.exists,
    ],
  },
];

export enum HookInNames {
  INITIAL = 'initial',
  PRE_VALIDATE_ARGS = 'preValidateArgs',
  POST_VALIDATE_ARGS = 'postValidateArgs',
  PRE_ARCHITECTURAL_AUTHORIZE = 'preArchitecturalAuthorize',
  POST_ARCHITECTURAL_AUTHORIZE = 'postArchitecturalAuthorize',
  PRE_FETCH = 'preFetch',
  POST_FETCH = 'postFetch',
  PRE_DOCUMENT_AUTHORIZE = 'preDocumentAuthorize',
  POST_DOCUMENT_AUTHORIZE = 'postDocumentAuthorize',
  PRE_VALIDATE_DOCUMENT = 'preValidateDocument',
  POST_VALIDATE_DOCUMENT = 'postValidateDocument',
  PRE_COMMIT = 'preCommit',
  POST_COMMIT = 'postCommit',
  FINAL = 'final',
  ERROR = 'error',
}

export const AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD = [
  'public',
  'signedIn',
  'admin',
];
