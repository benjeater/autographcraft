/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import type { ExtendedResolverType, HookInNames } from '@autographcraft/core';
import { type MongoDbBaseResolverParams } from '../MongoDbBaseResolver';
import type { HookInFile, HookInFunction } from '../../types';

export const DEFAULT_VALUES = {
  TEST_MODEL_NAME: 'User',
  TEST_DOCUMENT_ID: '507f1f77bcf86cd799439011',
} as const;

export type TestDocument = {
  id: string;
  firstName: string;
};

export type TestArgs = {
  input: Record<string, unknown>;
};

export function getStandardDocument(): TestDocument {
  return {
    id: DEFAULT_VALUES.TEST_DOCUMENT_ID,
    firstName: 'firstNameTest',
  };
}

export type MockLogger = {
  debug: any;
  info: any;
  warn: any;
  error: any;
};

export type BaseTestSetup = {
  initialisationParams: MongoDbBaseResolverParams<TestArgs, TestDocument>;
  logger: MockLogger;
};

export type BaseTestSetupOptions = {
  /** Whether a logger is attached to the resolver context. Defaults to `true`. */
  withLogger?: boolean;
};

/**
 * Builds a fresh set of mocks and resolver params for each test, so that call
 * counts from one test cannot leak into the next.
 */
export function getTestSetup(
  options: BaseTestSetupOptions = {}
): BaseTestSetup {
  const { withLogger = true } = options;

  const logger: MockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const initialisationParams: MongoDbBaseResolverParams<
    TestArgs,
    TestDocument
  > = {
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
    args: { input: { firstName: 'firstNameTest' } },
    modelName: DEFAULT_VALUES.TEST_MODEL_NAME,
    databaseModel: jest.fn() as any,
    hookInFiles: [],
    parent: { parentField: 'parentFieldTest' },
    info: { infoField: 'infoFieldTest' },
    architecturalAuthorisation: jest.fn().mockReturnValue(true) as any,
    documentAuthorisation: jest.fn().mockReturnValue(true) as any,
    getPermittedFieldsForDocument: jest
      .fn()
      .mockReturnValue(new Set(['id', 'firstName'])) as any,
  };

  return { initialisationParams, logger };
}

/**
 * Builds a hook-in file entry, so that specs only have to state the parts of
 * the hook that matter to them.
 */
export function makeHookInFile(
  resolverName: ExtendedResolverType,
  hookPoint: HookInNames,
  orderNumber: number,
  defaultFunction: HookInFunction
): HookInFile {
  return {
    filename: `${resolverName}-${hookPoint}-${orderNumber}.ts`,
    resolverName,
    hookPoint,
    orderNumber,
    defaultFunction,
  };
}

/**
 * Builds a hook that records the filename of every hook that has run, in the
 * order they were run, into the supplied array.
 */
export function makeRecordingHookInFile(
  resolverName: ExtendedResolverType,
  hookPoint: HookInNames,
  orderNumber: number,
  callOrder: string[]
): HookInFile {
  const filename = `${resolverName}-${hookPoint}-${orderNumber}.ts`;
  return makeHookInFile(
    resolverName,
    hookPoint,
    orderNumber,
    jest.fn<HookInFunction>().mockImplementation(async () => {
      callOrder.push(filename);
    })
  );
}
