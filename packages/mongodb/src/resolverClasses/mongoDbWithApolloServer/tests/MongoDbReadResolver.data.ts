/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import cloneDeep from 'lodash.clonedeep';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import type { ExtendedResolverType, Logger } from '@autographcraft/core';
import { type MongoDbReadResolverParams } from '../MongoDbReadResolver';
import type { HookInFile, HookInFunction } from '../../types';

const USER_MODEL_FIELDS = [
  'id',
  'firstName',
  'lastName',
  'email',
  'createdAt',
  'updatedAt',
  'deletedAt',
] as const;

export const DEFAULT_VALUES = {
  USER_MODEL_FIELDS,
  TEST_MODEL_NAME: 'User',
  TEST_DOCUMENT_ID: '507f1f77bcf86cd799439011',
  INVALID_DOCUMENT_ID: 'not-a-mongo-id',
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

/**
 * Every hook point that the read resolver can fire, in the order that the
 * resolver runs them on the happy path.  `ERROR` is deliberately last; it is
 * only fired when the resolver throws.
 */
export const READ_HOOK_POINTS_IN_ORDER = [
  HookInNames.INITIAL,
  HookInNames.PRE_VALIDATE_ARGS,
  HookInNames.POST_VALIDATE_ARGS,
  HookInNames.PRE_ARCHITECTURAL_AUTHORIZE,
  HookInNames.POST_ARCHITECTURAL_AUTHORIZE,
  HookInNames.PRE_FETCH,
  HookInNames.POST_FETCH,
  HookInNames.PRE_DOCUMENT_AUTHORIZE,
  HookInNames.POST_DOCUMENT_AUTHORIZE,
  HookInNames.FINAL,
] as const;

export type MockLogger = {
  [Key in keyof Logger]: jest.Mock<Logger[Key]>;
};

export type ReadTestSetup = {
  initialisationParams: MongoDbReadResolverParams<any, any>;
  /** The mongoose-model stand-in that the resolver reads through. */
  databaseModel: any;
  findByIdMock: jest.Mock<(id: string) => Promise<unknown>>;
  /** `toObject` on the document returned by `findById`. */
  toObjectMock: jest.Mock<(options: unknown) => Record<string, unknown>>;
  /** The (mongoose-document-like) object that `findById` resolves with. */
  databaseDocument: Record<string, unknown>;
  logger: MockLogger;
};

/**
 * Builds a fresh set of mocks and resolver params for each test, so that call
 * counts from one test cannot leak into the next.
 */
export function getTestSetup(): ReadTestSetup {
  const toObjectMock = jest
    .fn<(options: unknown) => Record<string, unknown>>()
    .mockImplementation(() => getStandardUser());

  const databaseDocument: Record<string, unknown> = {
    ...getStandardUser(),
    toObject: toObjectMock,
  };

  const findByIdMock = jest
    .fn<(id: string) => Promise<unknown>>()
    .mockResolvedValue(databaseDocument);

  const databaseModel = jest.fn() as any;
  databaseModel.findById = findByIdMock;

  const logger = getMockLogger();

  const initialisationParams: MongoDbReadResolverParams<any, any> = {
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
        logger,
      },
    } as any,
    args: { id: DEFAULT_VALUES.TEST_DOCUMENT_ID },
    modelName: DEFAULT_VALUES.TEST_MODEL_NAME,
    databaseModel,
    hookInFiles: [],
    parent: undefined,
    info: undefined,
    architecturalAuthorisation: jest.fn(async () => true) as any,
    documentAuthorisation: jest.fn(async () => true) as any,
    getPermittedFieldsForDocument: jest
      .fn()
      .mockReturnValue(new Set(DEFAULT_VALUES.USER_MODEL_FIELDS)) as any,
  };

  return {
    initialisationParams,
    databaseModel,
    findByIdMock,
    toObjectMock,
    databaseDocument,
    logger,
  };
}

export function getMockLogger(): MockLogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

/** Wraps a hook function in the file shape that the resolver expects. */
export function getHookInFile(
  hookPoint: HookInNames,
  defaultFunction: HookInFunction,
  resolverName: ExtendedResolverType = RESOLVER_NAME.READ,
  orderNumber = 1
): HookInFile {
  return {
    filename: `testFileHook-${hookPoint}`,
    resolverName,
    hookPoint,
    orderNumber,
    defaultFunction,
  };
}

export type AllHookMocks = {
  hookInFiles: HookInFile[];
  hooks: Record<HookInNames, jest.Mock<HookInFunction>>;
};

/**
 * Registers a mock against every hook point (including `ERROR`) so that a
 * single run can assert which hooks fired, and in which order.
 */
export function getAllHookMocks(): AllHookMocks {
  const hooks = {} as Record<HookInNames, jest.Mock<HookInFunction>>;
  const hookInFiles: HookInFile[] = [];

  for (const hookPoint of Object.values(HookInNames)) {
    const hookMock = jest.fn<HookInFunction>();
    hooks[hookPoint] = hookMock;
    hookInFiles.push(getHookInFile(hookPoint, hookMock));
  }

  return { hookInFiles, hooks };
}
