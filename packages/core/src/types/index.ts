import winston from 'winston';
import { DocumentNode } from 'graphql';
import mongoose from 'mongoose';
import { HookInNames } from '../constants';

export type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

export type ProcessFunction = (
  execPath: string,
  params: string[]
) => Promise<void>;

export type AutoGraphCraftConfiguration = {
  generatedTypesDirectory: string;
  generatedDatabaseDirectory: string;
  generatedUtilsDirectory: string;
  generatedModelsDirectory: string;
  queriesDirectory: string;
  mutationsDirectory: string;
  schemaSourceDirectory: string;
  gitIgnorePath: string;
  databaseType: DATABASE_CODES;
  mongoDbConnectionLibrary?: MONGO_DB_CONNECTION_LIBRARY;
  authorisationStructure: RootModelAuthorisationDetail[];
};

// This type is the same as the AutoGraphCraftConfiguration but all the enum fields are strings
export type AutoGraphCraftConfigurationOutput = {
  generatedTypesDirectory: string;
  generatedDatabaseDirectory: string;
  generatedUtilsDirectory: string;
  generatedModelsDirectory: string;
  queriesDirectory: string;
  mutationsDirectory: string;
  schemaSourceDirectory: string;
  gitIgnorePath: string;
  databaseType: string;
  mongoDbConnectionLibrary?: string;
  authorisationStructure: RootModelAuthorisationDetail[];
};

/**
 * This is a root node type that describes the authorisation structure of the models.
 * @field `targetModelName` - The name of the model that the authorisation join is for.
 * @field `joins` - An array of `ModelJoinAuthorisationDetail` that describe the joins to child models.
 */
export type RootModelAuthorisationDetail = {
  targetModelName: string;
  joins?: ModelJoinAuthorisationDetail[];
};

/**
 * This is a recursive type that describes the authorisation structure of the models.
 * @field `sourceJoinType` - The type of join in the source (parent) model that joins to the target model
 * in the schema.
 * @field `sourceIdFieldName` - The name of the field in the source (parent) model that contains the id
 * of the join.
 * For `hasOne` join types, this is the field in the source model that contains the target model's id.
 * For `hasMany` join types, this is the id field of the source model (i.e. `id`).
 * @field `targetModelName` - The name of the model that the authorisation join is for.
 * @field `targetModelIdFieldName` - The name of the field in the target (child) model that contains the id
 * of the join.
 * For `hasOne` join types, this is the id field of the target model (i.e. `id`).
 * For `hasMany` join types, this is the field in the target model that contains the source model's id.
 * @field `joins` - An array of `ModelJoinAuthorisationDetail` that describe the joins to child models.
 */
export type ModelJoinAuthorisationDetail = {
  sourceJoinType: 'hasOne' | 'hasMany';
  sourceIdFieldName: string;
  targetModelName: string;
  targetModelIdFieldName: string;
  joins?: ModelJoinAuthorisationDetail[];
};

export type AutoGraphCraftConfigurationField = Prettify<
  keyof AutoGraphCraftConfiguration
>;

export enum DATABASE_CODES {
  MONGO_DB = 'MONGO_DB',
  DYNAMO_DB = 'DYNAMO_DB',
  POSTGRESQL = 'POSTGRESQL',
}

export enum MONGO_DB_CONNECTION_LIBRARY {
  MONGOOSE = 'MONGOOSE',
  MONGOSH = 'MONGOSH',
}

export type DatabaseChoice = {
  name: string;
  description: string;
  value: DATABASE_CODES;
  disabled?: boolean | string;
};

export type MongoDbLibraryChoice = {
  name: string;
  description: string;
  value: MONGO_DB_CONNECTION_LIBRARY;
  disabled?: boolean | string;
};

export type MergedTypeDef = {
  typeDefs: DocumentNode;
  printableTypeDefs: string;
};

export type SingleDirectiveGeneratorOutput = Record<string, unknown>[];

export type DirectiveGeneratorOutput = Omit<DirectiveGeneratorContext, ''>;

export type ModelDetail = {
  modelName: string;
  queriesToGenerate: QueriesToGenerate;
  mutationsToGenerate: MutationsToGenerate;
  fields: FieldDetail[];
};

export type ModelAuthDetail = {
  modelName: string;
  authorisingModel: string;
  idField: string;
  methods: AUTH_METHOD[];
};

export type FieldDetail = {
  fieldName: string;
  fieldType: string;
  isList: boolean;
  isFieldNullable: boolean;
  isListContentNullable: boolean;
};

export type QueriesToGenerate = {
  read: boolean;
  list: boolean;
};

export type MutationsToGenerate = {
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type HasManyDetail = {
  sourceModelName: string;
  sourceModelConnectionFieldName: string;
  sourceModelJoinValueFieldName: string;
  targetModelName: string;
  targetModelIndexName: string;
};

export type HasOneDetail = {
  sourceModelName: string;
  sourceModelConnectionFieldName: string;
  sourceModelJoinValueFieldName: string;
  targetModelName: string;
};

export type IndexDetail = {
  modelName: string;
  indexName: string;
  primaryKeyName: string;
  secondaryKeyNames: string[];
};

export type ModelQueryDetail = {
  modelName: string;
  queryType: RESOLVER_NAME;
  queryName: string;
  returnType: string;
  args: ArgDetail[];
};

export type ModelMutationDetail = {
  modelName: string;
  mutationType: RESOLVER_NAME;
  mutationName: string;
  returnType: string;
  args: ArgDetail[];
};

export type ArgDetail = {
  argName: string;
  argType: string;
  isList: boolean;
  isArgumentNullable: boolean;
  isListContentNullable: boolean;
};

export type DirectiveGeneratorContext = Prettify<
  {
    logger: typeof winston;
    currentWorkingDirectory: string;
    configuration: AutoGraphCraftConfiguration;
    model: ModelDetail[];
    modelAuth: ModelAuthDetail[];
    modelQueries: ModelQueryDetail[];
    modelMutations: ModelMutationDetail[];
    hasMany: HasManyDetail[];
    hasOne: HasOneDetail[];
    index: IndexDetail[];
    customScalars: ScalarDetail[];
  } & MergedTypeDef
>;

export enum PossibleFilters {
  eq = 'eq',
  ne = 'ne',
  le = 'le',
  lt = 'lt',
  ge = 'ge',
  gt = 'gt',
  in = 'in',
  notIn = 'notIn',
  between = 'between',
  startsWith = 'startsWith',
  exists = 'exists',
}

export type ScalarDetail = {
  scalarName: string;
  javascriptType: string;
  filtersAvailable: PossibleFilters[];
};

export type OutputFileDetail = {
  filePath: string;
  content: string;
  addIgnoreHeader: boolean;
  shouldOverwrite: boolean;
};

export enum RESOLVER_NAME {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
}

export enum RESOLVER_CATEGORY_TYPE {
  QUERIES = 'queries',
  MUTATIONS = 'mutations',
  ALL = 'all',
}

export enum AUTH_METHOD {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  ALL = 'all',
}

export type ExtendedResolverType = RESOLVER_NAME | RESOLVER_CATEGORY_TYPE;

export type AutoGraphCraftAuthorisationInitialisationData = Record<
  string,
  unknown
>;

export type AutoGraphCraftAuthorisationInitialisationFromCacheData = {
  allAuthIds: string[];
};

export interface IAutoGraphCraftAuthorisation {
  /**
   * Initialises the AutoGraphCraftAuthorisation class with the data required to check the
   * permissions of the caller across all resolvers.
   *
   * @param rootIds An object with the keys being the model name and the values being
   * the id of the record to fetch as the entry point for the authorisation
   */
  initialise(
    data: AutoGraphCraftAuthorisationInitialisationData
  ): Promise<void>;

  /**
   * Initialises the AutoGraphCraftAuthorisation class with the data required to check the
   * permissions of the caller across all resolvers.
   *
   * @param data The data used to initialise the authorisation class from the cached values.
   * This cache data can be fetched using the `getCacheableData` method.
   */
  initialiseWithCachedData(
    data: AutoGraphCraftAuthorisationInitialisationFromCacheData
  ): Promise<void>;

  /**
   * Returns the data that can be cached to reinitialise the authorisation class at a later time.
   * @returns The data that can be cached to reinitialise the authorisation class at a later time.
   */
  getCacheableData(): AutoGraphCraftAuthorisationInitialisationFromCacheData;

  /**
   * Returns a boolean indicating if the authorisation class has any authorisation IDs for a
   * given model name.
   * @param modelName The name of the model to check for authorisation IDs
   * @returns `true` if the authorisation class has authorisation IDs for the model, `false` otherwise
   */
  hasAuthIdsForModel(modelName: string): boolean;

  /**
   * Checks if the current caller has the correct permissions to access the document.
   *
   * @param modelName The name of the model that the resolver is associated with
   * @param idFieldValue The id to check if the caller has permissions to access it
   * @returns `true` if the caller has the correct permissions, `false` otherwise
   */
  documentAuthorisation(modelName: string, idFieldValue?: string): boolean;

  /**
   * Returns all the ids for a given model name
   * @param modelName The name of the model to get the ids for
   * @returns An array of ids for the model
   */
  getAuthIdsForModel(modelName: string): string[];
}

export type Logger = {
  debug: (message: string | Record<string, unknown>) => void;
  info: (message: string | Record<string, unknown>) => void;
  warn: (message: string | Record<string, unknown>) => void;
  error: (message: string | Record<string, unknown>) => void;
};

export type AutoGraphCraftResolverContext = {
  autographcraft: {
    /**
     * An instance of the AutoGraphCraftAuthorisation class that can be used to check the
     * permissions of the caller across all resolvers.
     */
    authorisationInstance: IAutoGraphCraftAuthorisation;
    /**
     * An instance of mongoose connection that can be used to interact with the database.
     */
    mongooseConnection?: mongoose.Connection;
    /**
     * An instance of a logger that can be used to log messages to the console.  This has
     * been tested with winston and console.
     */
    logger?: Logger;
    /**
     * The default number of results to return from a list query if no limit argument is provided.
     * @default 100
     */
    defaultListQueryLimit?: number;
    /**
     * The maximum number of results to return from a list query.  No limit is applied if this is not set.
     */
    maxListQueryLimit?: number;
  };
};

type HookInFunction = (
  parent: unknown,
  args: unknown,
  context: AutoGraphCraftResolverContext,
  info: unknown,
  document: unknown
) => Promise<void>;

export type HookInFile = {
  filename: string;
  resolverName: ExtendedResolverType;
  hookPoint: HookInNames;
  orderNumber: number;
  defaultFunction: HookInFunction;
};
