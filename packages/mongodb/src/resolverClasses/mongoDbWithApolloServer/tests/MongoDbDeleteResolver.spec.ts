import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { GraphQLError } from 'graphql';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import { MongoDbDeleteResolver } from '../MongoDbDeleteResolver';
import type { HookInFunction } from '../../types';
import {
  DEFAULT_VALUES,
  DELETE_HOOK_POINTS_IN_ORDER,
  getAllHookMocks,
  getDeletedUser,
  getExpectedFilter,
  getHookInFile,
  getStandardUser,
  getTestSetup,
  type DeleteTestSetup,
} from './MongoDbDeleteResolver.data';

describe('MongoDbDeleteResolver', () => {
  let setup: DeleteTestSetup;

  beforeEach(() => {
    setup = getTestSetup();
  });

  it('should be defined', () => {
    expect(MongoDbDeleteResolver).toBeDefined();
  });

  describe('happy path', () => {
    it('should soft delete a document without any hooks or auth failures', async () => {
      // Arrange
      const {
        initialisationParams,
        findOneMock,
        findOneAndUpdateMock,
        toObjectMock,
      } = setup;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const result = await resolver.delete();

      // Assert
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(getExpectedFilter());
      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1);
      expect(toObjectMock).toHaveBeenCalledTimes(1);
      expect(toObjectMock).toHaveBeenCalledWith({ virtuals: true });
      expect(result).toEqual(getDeletedUser());
    });

    it('should update the document with a deletedAt timestamp using the same filter', async () => {
      // Arrange
      const { initialisationParams, findOneAndUpdateMock } = setup;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      await resolver.delete();

      // Assert
      expect(findOneAndUpdateMock).toHaveBeenCalledWith(getExpectedFilter(), {
        deletedAt: expect.any(Date),
      });
    });

    it('should authorise the caller architecturally and per document', async () => {
      // Arrange
      const { initialisationParams, databaseDocument } = setup;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      await resolver.delete();

      // Assert
      expect(
        initialisationParams.architecturalAuthorisation
      ).toHaveBeenCalledWith(initialisationParams.context);
      expect(initialisationParams.documentAuthorisation).toHaveBeenCalledWith(
        initialisationParams.context,
        databaseDocument
      );
      // The permitted fields are worked out against the deleted document
      expect(
        initialisationParams.getPermittedFieldsForDocument
      ).toHaveBeenCalledWith(initialisationParams.context, getDeletedUser());
    });

    it('should remove fields that the caller is not permitted to read', async () => {
      // Arrange
      const { initialisationParams } = setup;
      initialisationParams.getPermittedFieldsForDocument = jest.fn(
        async () => new Set(['id', 'deletedAt'])
      );

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const result = await resolver.delete();

      // Assert
      expect(result).toEqual({
        id: DEFAULT_VALUES.TEST_DOCUMENT_ID,
        deletedAt: DEFAULT_VALUES.DELETED_AT,
      });
    });
  });

  describe('hook in points', () => {
    it('should run every hook point in the documented order and not the error hook', async () => {
      // Arrange
      const { initialisationParams } = setup;
      const { hookInFiles, hooks } = getAllHookMocks();
      initialisationParams.hookInFiles = hookInFiles;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      await resolver.delete();

      // Assert
      const callOrders = DELETE_HOOK_POINTS_IN_ORDER.map((hookPoint) => {
        expect(hooks[hookPoint]).toHaveBeenCalledTimes(1);
        return hooks[hookPoint].mock.invocationCallOrder[0];
      });
      expect(callOrders).toEqual([...callOrders].sort((a, b) => a - b));
      expect(hooks[HookInNames.ERROR]).toHaveBeenCalledTimes(0);
      // Hook points that belong to other resolvers must not fire
      expect(hooks[HookInNames.PRE_VALIDATE_DOCUMENT]).toHaveBeenCalledTimes(0);
      expect(hooks[HookInNames.POST_VALIDATE_DOCUMENT]).toHaveBeenCalledTimes(
        0
      );
    });

    it('should run the commit hooks either side of the database update', async () => {
      // Arrange
      const { initialisationParams, findOneAndUpdateMock } = setup;
      const { hookInFiles, hooks } = getAllHookMocks();
      initialisationParams.hookInFiles = hookInFiles;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      await resolver.delete();

      // Assert
      const preCommitOrder =
        hooks[HookInNames.PRE_COMMIT].mock.invocationCallOrder[0];
      const updateOrder = findOneAndUpdateMock.mock.invocationCallOrder[0];
      const postCommitOrder =
        hooks[HookInNames.POST_COMMIT].mock.invocationCallOrder[0];

      expect(preCommitOrder).toBeLessThan(updateOrder);
      expect(updateOrder).toBeLessThan(postCommitOrder);
    });

    it('should pass a null document to hooks that run before the fetch', async () => {
      // Arrange
      const { initialisationParams } = setup;
      const { hookInFiles, hooks } = getAllHookMocks();
      initialisationParams.hookInFiles = hookInFiles;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      await resolver.delete();

      // Assert
      expect(hooks[HookInNames.PRE_FETCH]).toHaveBeenCalledWith(
        initialisationParams.parent,
        initialisationParams.args,
        initialisationParams.context,
        initialisationParams.info,
        null
      );
    });

    it('should pass the fetched document to the hooks between the fetch and the commit', async () => {
      // Arrange
      const { initialisationParams, databaseDocument } = setup;
      const { hookInFiles, hooks } = getAllHookMocks();
      initialisationParams.hookInFiles = hookInFiles;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      await resolver.delete();

      // Assert
      for (const hookPoint of [
        HookInNames.POST_FETCH,
        HookInNames.PRE_DOCUMENT_AUTHORIZE,
        HookInNames.POST_DOCUMENT_AUTHORIZE,
        HookInNames.PRE_COMMIT,
      ]) {
        expect(hooks[hookPoint].mock.calls[0][4]).toEqual([databaseDocument]);
      }
    });

    it('should pass the deleted document to the hooks that run after the commit', async () => {
      // Arrange
      const { initialisationParams } = setup;
      const { hookInFiles, hooks } = getAllHookMocks();
      initialisationParams.hookInFiles = hookInFiles;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      await resolver.delete();

      // Assert
      for (const hookPoint of [HookInNames.POST_COMMIT, HookInNames.FINAL]) {
        expect(hooks[hookPoint].mock.calls[0][4]).toEqual([getDeletedUser()]);
      }
    });

    it('should stop running hooks at the point the resolver throws', async () => {
      // Arrange
      const { initialisationParams } = setup;
      const { hookInFiles, hooks } = getAllHookMocks();
      initialisationParams.hookInFiles = hookInFiles;
      initialisationParams.args.id = DEFAULT_VALUES.INVALID_DOCUMENT_ID;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow();
      expect(hooks[HookInNames.INITIAL]).toHaveBeenCalledTimes(1);
      expect(hooks[HookInNames.PRE_VALIDATE_ARGS]).toHaveBeenCalledTimes(1);
      expect(hooks[HookInNames.POST_VALIDATE_ARGS]).toHaveBeenCalledTimes(0);
      expect(hooks[HookInNames.ERROR]).toHaveBeenCalledTimes(1);
    });

    it('should propagate an error thrown by a hook without committing the delete', async () => {
      // Arrange
      const { initialisationParams, findOneAndUpdateMock } = setup;
      const preCommitHook = jest
        .fn<HookInFunction>()
        .mockRejectedValue(new Error('Hook exploded'));
      initialisationParams.hookInFiles = [
        getHookInFile(HookInNames.PRE_COMMIT, preCommitHook),
      ];

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow('Hook exploded');
      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('validation and authorisation failures', () => {
    it('should throw an InvalidInputError when the id is not a MongoDB ObjectId', async () => {
      // Arrange
      const { initialisationParams, findOneMock } = setup;
      initialisationParams.args.id = DEFAULT_VALUES.INVALID_DOCUMENT_ID;

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow(
        `id ${DEFAULT_VALUES.INVALID_DOCUMENT_ID} is not a valid MongoDB ObjectId`
      );
      await expect(action).rejects.toMatchObject({
        extensions: { code: 'INVALID_INPUT' },
      });
      expect(findOneMock).toHaveBeenCalledTimes(0);
    });

    it('should throw a NoArchitecturalAccessError when the caller has no architectural access', async () => {
      // Arrange
      const { initialisationParams, findOneMock } = setup;
      initialisationParams.architecturalAuthorisation = jest.fn(
        async () => false
      );

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow(
        `Caller does not have permission to perform the ${RESOLVER_NAME.DELETE} operation on ${DEFAULT_VALUES.TEST_MODEL_NAME}`
      );
      await expect(action).rejects.toMatchObject({
        extensions: { code: 'NO_ARCHITECTURAL_ACCESS' },
      });
      expect(findOneMock).toHaveBeenCalledTimes(0);
    });

    it('should throw a NotFoundError when the document does not exist or is already deleted', async () => {
      // Arrange
      const { initialisationParams, findOneMock, findOneAndUpdateMock } = setup;
      findOneMock.mockResolvedValue(null);

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow(
        `Document with id ${DEFAULT_VALUES.TEST_DOCUMENT_ID} does not exist, or has already been deleted`
      );
      await expect(action).rejects.toMatchObject({
        extensions: { code: 'NOT_FOUND' },
      });
      expect(initialisationParams.documentAuthorisation).toHaveBeenCalledTimes(
        0
      );
      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(0);
    });

    it('should throw a NotAuthorisedError when the caller cannot access the document', async () => {
      // Arrange
      const { initialisationParams, findOneAndUpdateMock } = setup;
      initialisationParams.documentAuthorisation = jest.fn(async () => false);

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow(
        `Caller does not have permission to access document with id ${DEFAULT_VALUES.TEST_DOCUMENT_ID}`
      );
      await expect(action).rejects.toMatchObject({
        extensions: { code: 'NOT_AUTHORISED' },
      });
      expect(findOneAndUpdateMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('error handling', () => {
    it('should pass the fetched document to the error hook when the failure happens after the fetch', async () => {
      // Arrange
      const { initialisationParams, databaseDocument } = setup;
      const errorHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        getHookInFile(HookInNames.ERROR, errorHook),
      ];
      initialisationParams.documentAuthorisation = jest.fn(async () => false);

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow();
      expect(errorHook).toHaveBeenCalledTimes(1);
      expect(errorHook.mock.calls[0][4]).toEqual([databaseDocument]);
    });

    it('should pass null to the error hook when the failure happens before the fetch', async () => {
      // Arrange
      const { initialisationParams } = setup;
      const errorHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        getHookInFile(HookInNames.ERROR, errorHook),
      ];
      initialisationParams.architecturalAuthorisation = jest.fn(
        async () => false
      );

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow();
      expect(errorHook).toHaveBeenCalledTimes(1);
      expect(errorHook.mock.calls[0][4]).toBeNull();
    });

    it('should log the message of an Error that is thrown', async () => {
      // Arrange
      const { initialisationParams, findOneMock, logger } = setup;
      findOneMock.mockRejectedValue(new Error('Database unavailable'));

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow('Database unavailable');
      expect(logger.error).toHaveBeenCalledWith('Database unavailable');
    });

    it('should wrap a non-GraphQLError in a GraphQLError', async () => {
      // Arrange
      const { initialisationParams, findOneMock } = setup;
      findOneMock.mockRejectedValue(new Error('Database unavailable'));

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      let thrownError: unknown;
      try {
        await resolver.delete();
      } catch (err) {
        thrownError = err;
      }

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe(
        'Database unavailable'
      );
      expect((thrownError as GraphQLError).extensions.code).toBeUndefined();
    });

    it('should rethrow a GraphQLError without rewrapping it', async () => {
      // Arrange
      const { initialisationParams, findOneMock } = setup;
      const originalError = new GraphQLError('Already a GraphQLError');
      findOneMock.mockRejectedValue(originalError);

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      let thrownError: unknown;
      try {
        await resolver.delete();
      } catch (err) {
        thrownError = err;
      }

      // Assert
      expect(thrownError).toBe(originalError);
    });

    it('should handle a thrown value that is not an Error', async () => {
      // Arrange
      const { initialisationParams, findOneMock, logger } = setup;
      findOneMock.mockImplementation(() => Promise.reject('a string failure'));

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      let thrownError: unknown;
      try {
        await resolver.delete();
      } catch (err) {
        thrownError = err;
      }

      // Assert
      expect(logger.error).toHaveBeenCalledWith('An error occurred');
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe('An error occurred');
    });

    it('should not fail when no logger is configured on the context', async () => {
      // Arrange
      const { initialisationParams, findOneMock } = setup;
      initialisationParams.context.autographcraft.logger = undefined;
      findOneMock.mockRejectedValue(new Error('Database unavailable'));

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow('Database unavailable');
    });

    it('should not fail when no logger is configured and a non-Error is thrown', async () => {
      // Arrange
      const { initialisationParams, findOneMock } = setup;
      initialisationParams.context.autographcraft.logger = undefined;
      findOneMock.mockImplementation(() => Promise.reject('a string failure'));

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow('An error occurred');
    });

    it('should throw a NotFoundError when the document is deleted between the fetch and the update', async () => {
      // Arrange
      // The update filter still requires `deletedAt: null`, so a concurrent
      // delete leaves nothing to update and `findOneAndUpdate` resolves null.
      const { initialisationParams, findOneAndUpdateMock } = setup;
      findOneAndUpdateMock.mockResolvedValue(null);

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      let thrownError: unknown;
      try {
        await resolver.delete();
      } catch (err) {
        thrownError = err;
      }

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe(
        `Document with id ${DEFAULT_VALUES.TEST_DOCUMENT_ID} does not exist, or has already been deleted`
      );
      expect((thrownError as GraphQLError).extensions.code).toBe('NOT_FOUND');
    });

    it('should pass the fetched document to the error hook when the commit fails', async () => {
      // Arrange
      const { initialisationParams, findOneAndUpdateMock, databaseDocument } =
        setup;
      const errorHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        getHookInFile(HookInNames.ERROR, errorHook),
      ];
      findOneAndUpdateMock.mockRejectedValue(new Error('Write conflict'));

      // Act
      const resolver = new MongoDbDeleteResolver(initialisationParams);
      const action = async () => await resolver.delete();

      // Assert
      await expect(action).rejects.toThrow('Write conflict');
      expect(errorHook.mock.calls[0][4]).toEqual([databaseDocument]);
      expect(databaseDocument).toEqual(getStandardUser());
    });
  });
});
