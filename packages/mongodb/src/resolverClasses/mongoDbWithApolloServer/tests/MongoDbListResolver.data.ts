/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import cloneDeep from 'lodash.clonedeep';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import type { ExtendedResolverType } from '@autographcraft/core';
import { type MongoDbListResolverParams } from '../MongoDbListResolver';
import type { HookInFile, HookInFunction } from '../../types';

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
  DEFAULT_LIST_QUERY_LIMIT: 100,
} as const;

export type TestUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

/** The shape of the arguments a generated list query is called with. */
export type ListArgs = {
  filter?: Record<string, unknown> | null;
  limit?: number | null;
  nextToken?: string | null;
  sort?: Record<string, unknown>[] | null;
};

/** The shape of the object a generated list query returns. */
export type ListReturn = {
  results: (TestUser | null)[];
  nextToken?: string | null;
};

const standardUsers: TestUser[] = [
  {
    id: '507f1f77bcf86cd799439011',
    firstName: 'firstNameTestOne',
    lastName: 'lastNameTestOne',
    email: 'emailTestOne',
    createdAt: new Date('2024-06-01T12:00:00.000Z'),
    updatedAt: new Date('2024-06-01T12:00:00.000Z'),
    deletedAt: null,
  },
  {
    id: '507f1f77bcf86cd799439012',
    firstName: 'firstNameTestTwo',
    lastName: 'lastNameTestTwo',
    email: 'emailTestTwo',
    createdAt: new Date('2024-06-02T12:00:00.000Z'),
    updatedAt: new Date('2024-06-02T12:00:00.000Z'),
    deletedAt: null,
  },
];

export function getStandardUsers(): TestUser[] {
  return cloneDeep(standardUsers);
}

/**
 * Wraps plain user objects so that they behave like the mongoose documents the
 * resolver receives back from `Model.find`.
 */
export function getStandardUserDatabaseObjects(
  users: TestUser[] = getStandardUsers()
): Record<string, unknown>[] {
  return users.map((user) => ({
    ...cloneDeep(user),
    toObject: jest.fn().mockReturnValue(cloneDeep(user)),
  }));
}

export type ListTestSetupOptions = {
  /**
   * The documents the database `find` call resolves with. `null` simulates the
   * database returning no result at all.
   */
  documents?: TestUser[] | null;
  /** The authorisation filter returned by `getListFilter`. */
  listFilter?: Record<string, unknown>;
  /** Whether a logger is attached to the resolver context. Defaults to `true`. */
  withLogger?: boolean;
};

export type MockLogger = {
  debug: any;
  info: any;
  warn: any;
  error: any;
};

export type ListTestSetup = {
  initialisationParams: MongoDbListResolverParams<ListArgs, TestUser>;
  findMock: any;
  getListFilterMock: any;
  logger: MockLogger;
};

/**
 * Builds a fresh set of mocks and resolver params for each test, so that call
 * counts from one test cannot leak into the next.
 */
export function getTestSetup(
  options: ListTestSetupOptions = {}
): ListTestSetup {
  const {
    documents = getStandardUsers(),
    listFilter = {},
    withLogger = true,
  } = options;

  const findMock = jest.fn(async () =>
    documents === null ? null : getStandardUserDatabaseObjects(documents)
  ) as any;

  const databaseModel = { find: findMock } as any;

  const logger: MockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const getListFilterMock = jest.fn(async () => cloneDeep(listFilter)) as any;

  const initialisationParams: MongoDbListResolverParams<ListArgs, TestUser> = {
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
        ...(withLogger ? { logger } : {}),
      },
    } as any,
    args: {},
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
    getListFilter: getListFilterMock,
  };

  return { initialisationParams, findMock, getListFilterMock, logger };
}

/**
 * Builds a hook-in file entry for the list resolver, so that specs only have to
 * state the parts of the hook that matter to them.
 */
export function makeHookInFile(
  hookPoint: HookInNames,
  defaultFunction: HookInFunction,
  overrides: Partial<Omit<HookInFile, 'hookPoint' | 'defaultFunction'>> = {}
): HookInFile {
  return {
    filename: 'testFileHook',
    resolverName: RESOLVER_NAME.LIST as ExtendedResolverType,
    orderNumber: 1,
    ...overrides,
    hookPoint,
    defaultFunction,
  };
}
