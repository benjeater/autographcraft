import { jest, describe, it, expect } from '@jest/globals';
import {
  HookInNames,
  RESOLVER_CATEGORY_TYPE,
  RESOLVER_NAME,
} from '@autographcraft/core';
import { MongoDbBaseResolver } from '../MongoDbBaseResolver';
import type { HookInFunction } from '../../types';
import {
  DEFAULT_VALUES,
  getStandardDocument,
  getTestSetup,
  makeHookInFile,
  makeRecordingHookInFile,
  type TestArgs,
  type TestDocument,
} from './MongoDbBaseResolver.data';

describe('MongoDbBaseResolver', () => {
  it('should be defined', () => {
    expect(MongoDbBaseResolver).toBeDefined();
  });

  it('should expose the initialisation params on the instance', () => {
    // Arrange
    const { initialisationParams } = getTestSetup();

    // Act
    const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
      initialisationParams
    );

    // Assert
    expect(resolver.parent).toBe(initialisationParams.parent);
    expect(resolver.args).toBe(initialisationParams.args);
    expect(resolver.context).toBe(initialisationParams.context);
    expect(resolver.info).toBe(initialisationParams.info);
    expect(resolver.modelName).toBe(DEFAULT_VALUES.TEST_MODEL_NAME);
  });

  describe('getAndRunHooks', () => {
    it('should run a hook that matches both the resolver name and the hook point', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const hook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(RESOLVER_NAME.CREATE, HookInNames.INITIAL, 1, hook),
      ];
      const documents = [getStandardDocument()];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        documents
      );

      // Assert
      expect(hook).toHaveBeenCalledTimes(1);
      expect(hook).toHaveBeenCalledWith(
        initialisationParams.parent,
        initialisationParams.args,
        initialisationParams.context,
        initialisationParams.info,
        documents
      );
    });

    it('should not run a hook registered against a different hook point', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const matchingHook = jest.fn<HookInFunction>();
      const otherHookPointHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(
          RESOLVER_NAME.CREATE,
          HookInNames.INITIAL,
          1,
          matchingHook
        ),
        makeHookInFile(
          RESOLVER_NAME.CREATE,
          HookInNames.FINAL,
          1,
          otherHookPointHook
        ),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(matchingHook).toHaveBeenCalledTimes(1);
      expect(otherHookPointHook).toHaveBeenCalledTimes(0);
    });

    it('should not run a hook registered against a different resolver name', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const otherResolverHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(
          RESOLVER_NAME.DELETE,
          HookInNames.INITIAL,
          1,
          otherResolverHook
        ),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(otherResolverHook).toHaveBeenCalledTimes(0);
    });

    it('should run queries hooks for a query resolver but not for a mutation resolver', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const queriesHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(
          RESOLVER_CATEGORY_TYPE.QUERIES,
          HookInNames.INITIAL,
          1,
          queriesHook
        ),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.LIST,
        HookInNames.INITIAL,
        null
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.READ,
        HookInNames.INITIAL,
        null
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(queriesHook).toHaveBeenCalledTimes(2);
    });

    it('should run mutations hooks for a mutation resolver but not for a query resolver', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const mutationsHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(
          RESOLVER_CATEGORY_TYPE.MUTATIONS,
          HookInNames.INITIAL,
          1,
          mutationsHook
        ),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        null
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.UPDATE,
        HookInNames.INITIAL,
        null
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.DELETE,
        HookInNames.INITIAL,
        null
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.LIST,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(mutationsHook).toHaveBeenCalledTimes(3);
    });

    it('should run all hooks for both query and mutation resolvers', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const allHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(
          RESOLVER_CATEGORY_TYPE.ALL,
          HookInNames.INITIAL,
          1,
          allHook
        ),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.LIST,
        HookInNames.INITIAL,
        null
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(allHook).toHaveBeenCalledTimes(2);
    });

    it('should run exact matches first, then resolver type matches, then all matches', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const callOrder: string[] = [];
      initialisationParams.hookInFiles = [
        makeRecordingHookInFile(
          RESOLVER_CATEGORY_TYPE.ALL,
          HookInNames.INITIAL,
          2,
          callOrder
        ),
        makeRecordingHookInFile(
          RESOLVER_NAME.LIST,
          HookInNames.INITIAL,
          2,
          callOrder
        ),
        makeRecordingHookInFile(
          RESOLVER_CATEGORY_TYPE.QUERIES,
          HookInNames.INITIAL,
          2,
          callOrder
        ),
        makeRecordingHookInFile(
          RESOLVER_CATEGORY_TYPE.ALL,
          HookInNames.INITIAL,
          1,
          callOrder
        ),
        makeRecordingHookInFile(
          RESOLVER_NAME.LIST,
          HookInNames.INITIAL,
          1,
          callOrder
        ),
        makeRecordingHookInFile(
          RESOLVER_CATEGORY_TYPE.QUERIES,
          HookInNames.INITIAL,
          1,
          callOrder
        ),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.LIST,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(callOrder).toEqual([
        'list-initial-1.ts',
        'list-initial-2.ts',
        'queries-initial-1.ts',
        'queries-initial-2.ts',
        'all-initial-1.ts',
        'all-initial-2.ts',
      ]);
    });

    it('should run the hooks one after another rather than in parallel', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const callOrder: string[] = [];
      const slowHook = jest
        .fn<HookInFunction>()
        .mockImplementation(async () => {
          await Promise.resolve();
          callOrder.push('slowHookFinished');
        });
      const fastHook = jest
        .fn<HookInFunction>()
        .mockImplementation(async () => {
          callOrder.push('fastHookStarted');
        });
      initialisationParams.hookInFiles = [
        makeHookInFile(RESOLVER_NAME.CREATE, HookInNames.INITIAL, 1, slowHook),
        makeHookInFile(RESOLVER_NAME.CREATE, HookInNames.INITIAL, 2, fastHook),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(callOrder).toEqual(['slowHookFinished', 'fastHookStarted']);
    });

    it('should log the hooks that are about to be run', async () => {
      // Arrange
      const { initialisationParams, logger } = getTestSetup();
      const hookInFile = makeHookInFile(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        1,
        jest.fn<HookInFunction>()
      );
      initialisationParams.hookInFiles = [hookInFile];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(logger.debug).toHaveBeenCalledWith({
        [`${HookInNames.INITIAL}Hooks`]: [hookInFile],
      });
    });

    it('should run the hooks without a logger attached to the context', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup({ withLogger: false });
      const hook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(RESOLVER_NAME.CREATE, HookInNames.INITIAL, 1, hook),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      await resolver.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        null
      );

      // Assert
      expect(hook).toHaveBeenCalledTimes(1);
    });

    it('should propagate an error thrown by a hook', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const throwingHook = jest
        .fn<HookInFunction>()
        .mockImplementation(async () => {
          throw new Error('Test hook error');
        });
      const laterHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(
          RESOLVER_NAME.CREATE,
          HookInNames.INITIAL,
          1,
          throwingHook
        ),
        makeHookInFile(RESOLVER_NAME.CREATE, HookInNames.INITIAL, 2, laterHook),
      ];

      // Act
      const resolver = new MongoDbBaseResolver<TestArgs, TestDocument>(
        initialisationParams
      );
      const action = async () =>
        await resolver.getAndRunHooks(
          RESOLVER_NAME.CREATE,
          HookInNames.INITIAL,
          null
        );

      // Assert
      await expect(action).rejects.toThrow('Test hook error');
      expect(laterHook).toHaveBeenCalledTimes(0);
    });
  });
});
