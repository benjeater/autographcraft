import { jest } from '@jest/globals';
import cloneDeep from 'lodash.clonedeep';
import { AutoGraphCraftAuthorisationParams } from '../../types';
import type { ModelJoinAuthorisationDetail } from '../../../types';
import mongoose from 'mongoose';
import { DATABASE_CODES, MONGO_DB_CONNECTION_LIBRARY } from '../../../types';

export const DEFAULT_IDS: Record<string, string> = {
  RootModel: 'rootModelId1234',
  TargetModelOne: 'targetModelId1111',
  TargetModelTwo: 'targetModelId2222',
  TargetModelThree: 'targetModelId3333',
  TargetModelFour: 'targetModelId4444',
  TargetModelFive: 'targetModelId5555',
} as const;

export const UNKNOWN_JOIN_TYPE = 'unknownJoinType';

const paramsHasOne: AutoGraphCraftAuthorisationParams = {
  authorisationStructure: [
    {
      targetModelName: 'RootModel',
      joins: [
        {
          sourceJoinType: 'hasOne',
          sourceIdFieldName: 'targetModelId',
          targetModelName: 'TargetModelHasOne',
          targetModelIdFieldName: 'id',
        },
      ],
    },
  ],
  databaseType: DATABASE_CODES.MONGO_DB,
  mongoDbConnectionLibrary: MONGO_DB_CONNECTION_LIBRARY.MONGOOSE,
  mongooseConnection: {
    model: jest.fn((modelName: string) => {
      if (modelName === 'RootModel') {
        return {
          findById: jest.fn<() => Promise<unknown>>().mockResolvedValue({
            get: jest.fn((fieldName: string) => {
              if (fieldName === 'id') {
                return DEFAULT_IDS.RootModel;
              }
              if (fieldName === 'targetModelId') {
                return DEFAULT_IDS.TargetModelOne;
              }
            }),
          }),
        };
      }
      if (modelName === 'TargetModelHasOne') {
        return {
          find: jest.fn<() => Promise<unknown>>().mockResolvedValue([
            {
              get: jest.fn().mockReturnValue(DEFAULT_IDS.TargetModelOne),
            },
          ]),
        };
      }
      if (modelName === 'TargetModelHasMany') {
        return {
          find: jest.fn<() => Promise<unknown>>().mockResolvedValue([
            {
              get: jest.fn().mockReturnValue(DEFAULT_IDS.TargetModelOne),
            },
            {
              get: jest.fn().mockReturnValue(DEFAULT_IDS.TargetModelTwo),
            },
          ]),
        };
      }
      if (modelName === 'TargetModelHasManyChild') {
        return {
          find: jest.fn<() => Promise<unknown>>().mockResolvedValue([
            {
              get: jest.fn().mockReturnValue(DEFAULT_IDS.TargetModelThree),
            },
            {
              get: jest.fn().mockReturnValue(DEFAULT_IDS.TargetModelFour),
            },
            {
              get: jest.fn().mockReturnValue(DEFAULT_IDS.TargetModelFive),
            },
          ]),
        };
      }
    }),
  } as unknown as mongoose.Connection,
};

export function getDefaultParamsHasOne() {
  return cloneDeep(paramsHasOne);
}

export function getDefaultParamsHasMany() {
  const params = cloneDeep(paramsHasOne);
  params.authorisationStructure = [
    {
      targetModelName: 'RootModel',
      joins: [
        {
          sourceJoinType: 'hasMany',
          sourceIdFieldName: 'id',
          targetModelName: 'TargetModelHasMany',
          targetModelIdFieldName: 'rootModelId',
        },
      ],
    },
  ];

  return cloneDeep(params);
}

export function getDefaultParamsHasManyWithJoins() {
  const params = getDefaultParamsHasMany();
  params.authorisationStructure = [
    {
      targetModelName: 'RootModel',
      joins: [
        {
          sourceJoinType: 'hasMany',
          sourceIdFieldName: 'id',
          targetModelName: 'TargetModelHasMany',
          targetModelIdFieldName: 'rootModelId',
          joins: [
            {
              sourceJoinType: 'hasMany',
              sourceIdFieldName: 'id',
              targetModelName: 'TargetModelHasManyChild',
              targetModelIdFieldName: 'hasManyModelId',
            },
          ],
        },
      ],
    },
  ];

  return params;
}

export function getParamsWithNoAuthStructureForRootModel() {
  const params = cloneDeep(paramsHasOne);
  params.authorisationStructure = [
    {
      targetModelName: 'UnrelatedModel',
      joins: [
        {
          sourceJoinType: 'hasOne',
          sourceIdFieldName: 'targetModelId',
          targetModelName: 'TargetModelHasOne',
          targetModelIdFieldName: 'id',
        },
      ],
    },
  ];

  return params;
}

export function getParamsWithNoJoins() {
  const params = cloneDeep(paramsHasOne);
  params.authorisationStructure = [
    {
      targetModelName: 'RootModel',
      joins: [],
    },
  ];

  return params;
}

export function getParamsWithUnknownJoinType() {
  const params = cloneDeep(paramsHasOne);
  params.authorisationStructure[0].joins = [
    {
      // The join type is validated at compile time, so the runtime guard can
      // only be reached by casting an unsupported value into the union.
      sourceJoinType:
        UNKNOWN_JOIN_TYPE as ModelJoinAuthorisationDetail['sourceJoinType'],
      sourceIdFieldName: 'targetModelId',
      targetModelName: 'TargetModelHasOne',
      targetModelIdFieldName: 'id',
    },
  ];

  return params;
}

export function getParamsWithMissingRootDocument() {
  const params = cloneDeep(paramsHasOne);
  params.mongooseConnection = {
    model: jest.fn(() => ({
      findById: jest.fn<() => Promise<unknown>>().mockResolvedValue(null),
    })),
  } as unknown as mongoose.Connection;

  return params;
}
