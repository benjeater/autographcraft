/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloneDeep } from 'lodash';
import type { AutoGraphCraftAuthorisationParams } from '../types';
import { DATABASE_CODES, MONGO_DB_CONNECTION_LIBRARY } from '../../types';

export const DEFAULT_VALUES = {
  testModel: 'TestModel',
  fieldName: 'fieldName',
  targetModelName: 'TargetModelName',
  targetModelIdFieldName: 'targetModelIdFieldName',
  targetModelNameTwo: 'TargetModelNameTwo',
  targetModelIdFieldNameTwo: 'targetModelIdFieldName',
} as const;

export const mongooseConnectionModelFindById = jest.fn();

export const mongooseConnectionModelFind = jest.fn();

export const mongooseConnectionModel = {
  findById: mongooseConnectionModelFindById,
  find: mongooseConnectionModelFind,
};

const mongooseConnection: any = {
  model: () => mongooseConnectionModel,
};

const defaultAuthorisationParams: AutoGraphCraftAuthorisationParams = {
  databaseType: DATABASE_CODES.MONGO_DB,
  mongoDbConnectionLibrary: MONGO_DB_CONNECTION_LIBRARY.MONGOOSE,
  mongooseConnection,
  authorisationStructure: [
    {
      targetModelName: DEFAULT_VALUES.testModel,
      joins: [],
    },
  ],
  logger: {
    info: jest.fn(),
  } as any,
};

export function getDefaultAuthorisationParams() {
  const clonedParams = cloneDeep(defaultAuthorisationParams);
  // Required to ensure that the mongoose connection is shared between tests
  clonedParams.mongooseConnection = mongooseConnection;
  return clonedParams;
}
