/* eslint-disable @typescript-eslint/no-explicit-any */
import { cloneDeep } from 'lodash';
import { type MongoDbCreateResolverParams } from '../MongoDbCreateResolver';

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
} as const;

const standardUser = {
  id: '123',
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

export function getStandardUserDatabaseObject() {
  return {
    ...getStandardUser(),
    toObject: jest.fn().mockReturnValue(getStandardUser()),
  };
}

export function getStandardUserInput() {
  const standardUserInput = {
    firstName: standardUser.firstName,
    lastName: standardUser.lastName,
    email: standardUser.email,
  };
  return cloneDeep(standardUserInput);
}

const databaseModelImplementationSave = jest
  .fn()
  .mockResolvedValue(getStandardUserDatabaseObject());

const databaseModelImplementationValidate = jest.fn();

const databaseModelImplementation = jest.fn().mockImplementation(() => {
  return {
    validate: databaseModelImplementationValidate,
    save: databaseModelImplementationSave,
  };
}) as any;

export function getDatabaseModelImplementation() {
  return databaseModelImplementation;
}

export function getDatabaseModelImplementationSave() {
  return databaseModelImplementationSave;
}

export function getDatabaseModelImplementationValidate() {
  return databaseModelImplementationValidate;
}

const initialisationParams: MongoDbCreateResolverParams<any, any> = {
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
  },
  args: { input: getStandardUserInput() },
  modelName: DEFAULT_VALUES.TEST_MODEL_NAME,
  databaseModel: databaseModelImplementation,
  hookInFiles: [],
  parent: undefined,
  info: undefined,
  architecturalAuthorisation: jest.fn().mockReturnValue(true),
  documentAuthorisation: jest.fn().mockReturnValue(true),
  getPermittedFieldsForDocument: jest
    .fn()
    .mockReturnValue(new Set(DEFAULT_VALUES.USER_MODEL_FIELDS)),
};

initialisationParams.databaseModel.create = jest.fn().mockResolvedValue({
  toObject: jest.fn().mockReturnValue(getStandardUser()),
});

export function getInitialisationParams() {
  const clonedInitialisationParams = cloneDeep(initialisationParams);
  clonedInitialisationParams.databaseModel = databaseModelImplementation;
  return clonedInitialisationParams;
}
