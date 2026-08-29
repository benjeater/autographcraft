/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import cloneDeep from 'lodash.clonedeep';
import { type MongoDbUpdateResolverParams } from '../MongoDbUpdateResolver';

const USER_MODEL_FIELDS = [
  'id',
  'firstName',
  'lastName',
  'email',
  'testField',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const;

export const DEFAULT_VALUES = {
  USER_MODEL_FIELDS,
  TEST_MODEL_NAME: 'User',
  TEST_DOCUMENT_ID: '507f1f77bcf86cd799439011',
} as const;

const standardUser = {
  id: DEFAULT_VALUES.TEST_DOCUMENT_ID,
  firstName: 'firstNameTest',
  lastName: 'lastNameTest',
  email: 'emailTest',
  createdAt: new Date('2024-06-01T12:00:00.000Z'),
  updatedAt: new Date('2024-06-01T12:00:00.000Z'),
  deletedAt: null,
};

export function getStandardUser() {
  return cloneDeep(standardUser);
}

export function getStandardUserInput() {
  return cloneDeep({
    id: DEFAULT_VALUES.TEST_DOCUMENT_ID,
    firstName: 'updatedFirstName',
  });
}

export type UpdateTestSetup = {
  initialisationParams: MongoDbUpdateResolverParams<any, any>;
  findOneMock: any;
  validateMock: any;
  saveMock: any;
  /** The merged document instance handed to the validate and commit hooks. */
  getDocumentInstance: () => Record<string, unknown>;
};

/**
 * Builds a fresh set of mocks and resolver params for each test, so that call
 * counts from one test cannot leak into the next.
 */
export function getTestSetup(): UpdateTestSetup {
  let documentInstance: Record<string, unknown> = {};

  const validateMock = jest.fn(async () => undefined);
  const saveMock = jest.fn(async () => ({
    toObject: jest.fn().mockImplementation(() => {
      const documentFields = { ...documentInstance };
      delete documentFields.validate;
      delete documentFields.save;
      return documentFields;
    }),
  }));

  const databaseModel = jest.fn((seedDocument: Record<string, unknown>) => {
    documentInstance = {
      ...seedDocument,
      validate: validateMock,
      save: saveMock,
    };
    return documentInstance;
  }) as any;

  const findOneMock = jest.fn(async () => getStandardUser());
  databaseModel.findOne = findOneMock;

  const initialisationParams: MongoDbUpdateResolverParams<any, any> = {
    context: {
      autographcraft: {
        authorisationInstance: {
          initialise: jest.fn(),
          initialiseWithCachedData: jest.fn(),
          getCacheableData: jest.fn(),
          hasAuthIdsForModel: jest.fn().mockReturnValue(true),
          documentAuthorisation: jest.fn().mockReturnValue(true),
          getAuthIdsForModel: jest.fn().mockReturnValue([]),
        },
      },
    } as any,
    args: { input: getStandardUserInput() },
    modelName: DEFAULT_VALUES.TEST_MODEL_NAME,
    databaseModel,
    hookInFiles: [],
    parent: undefined,
    info: undefined,
    architecturalAuthorisation: jest.fn().mockReturnValue(true) as any,
    documentAuthorisation: jest.fn().mockReturnValue(true) as any,
    getPermittedFieldsForDocument: jest
      .fn()
      .mockReturnValue(new Set(DEFAULT_VALUES.USER_MODEL_FIELDS)) as any,
  };

  return {
    initialisationParams,
    findOneMock,
    validateMock,
    saveMock,
    getDocumentInstance: () => documentInstance,
  };
}
