import { jest, describe, it, expect } from '@jest/globals';
import { GraphQLError } from 'graphql';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import { MongoDbListResolver } from '../MongoDbListResolver';
import type { HookInFunction } from '../../types';
import {
  DEFAULT_VALUES,
  getStandardUsers,
  getTestSetup,
  makeHookInFile,
  type ListArgs,
  type ListReturn,
  type TestUser,
} from './MongoDbListResolver.data';

const DELETED_AT_FILTER = { deletedAt: { $eq: null } };

describe('MongoDbListResolver', () => {
  it('should be defined', () => {
    expect(MongoDbListResolver).toBeDefined();
  });

  it('should list documents without any hooks or auth failures', async () => {
    // Arrange
    const { initialisationParams, findMock, getListFilterMock } =
      getTestSetup();

    // Act
    const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
      initialisationParams
    );
    const result = await resolver.list();

    // Assert
    expect(findMock).toHaveBeenCalledTimes(1);
    expect(getListFilterMock).toHaveBeenCalledTimes(1);
    expect(getListFilterMock).toHaveBeenCalledWith(
      initialisationParams.context
    );
    expect(findMock).toHaveBeenCalledWith(
      { $and: [DELETED_AT_FILTER] },
      undefined,
      { limit: DEFAULT_VALUES.DEFAULT_LIST_QUERY_LIMIT, skip: 0 }
    );
    expect(result).toEqual({
      results: getStandardUsers(),
      nextToken: null,
    });
  });

  describe('deletedAt filtering', () => {
    it('should add a deletedAt filter to a filter that does not contain one', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.filter = { firstName: { eq: 'firstNameTest' } };

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(
        {
          $and: [
            {
              firstName: { $eq: 'firstNameTest' },
              ...DELETED_AT_FILTER,
            },
          ],
        },
        undefined,
        expect.anything()
      );
    });

    it('should not overwrite a deletedAt filter provided at the top level of the args filter', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.filter = {
        deletedAt: { exists: true },
      };

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(
        { $and: [{ deletedAt: { $exists: true } }] },
        undefined,
        expect.anything()
      );
    });

    it('should not overwrite a deletedAt filter nested inside a recursive filter node', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.filter = {
        and: [{ deletedAt: { exists: true } }],
      };

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      const [filterArgument] = findMock.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(filterArgument).toEqual({
        $and: [{ $and: [{ deletedAt: { $exists: true } }] }],
      });
    });
  });

  describe('filter combination', () => {
    it('should combine the args filter with the authorisation filter', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup({
        listFilter: { ownerId: 'ownerIdTest' },
      });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(
        { $and: [DELETED_AT_FILTER, { ownerId: 'ownerIdTest' }] },
        undefined,
        expect.anything()
      );
    });

    it('should drop an empty authorisation filter from the combined filter', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup({
        listFilter: {},
      });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      const [filterArgument] = findMock.mock.calls[0] as [
        { $and: Record<string, unknown>[] },
      ];
      expect(filterArgument.$and).toHaveLength(1);
    });

    it('should apply no filter constraints when a hook clears the args filter', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.hookInFiles = [
        makeHookInFile(
          HookInNames.PRE_FETCH,
          jest
            .fn<HookInFunction>()
            .mockImplementation(async (_parent, args) => {
              (args as ListArgs).filter = null;
            })
        ),
      ];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(
        { $and: [] },
        undefined,
        expect.anything()
      );
    });
  });

  describe('limit', () => {
    it('should use the limit provided in the args', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.limit = 5;

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: 5,
        skip: 0,
      });
    });

    it('should use the configured default limit when the args do not provide one', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.context.autographcraft.defaultListQueryLimit = 25;

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: 25,
        skip: 0,
      });
    });

    it('should cap the limit at the configured maximum limit', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.limit = 500;
      initialisationParams.context.autographcraft.maxListQueryLimit = 50;

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: 50,
        skip: 0,
      });
    });

    it('should fall back to the built in default limit when reading the configured limit throws', async () => {
      // Arrange
      const { initialisationParams, findMock, logger } = getTestSetup();
      Object.defineProperty(
        initialisationParams.context.autographcraft,
        'defaultListQueryLimit',
        {
          get() {
            throw new Error('defaultListQueryLimit is unavailable');
          },
        }
      );

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: DEFAULT_VALUES.DEFAULT_LIST_QUERY_LIMIT,
        skip: 0,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        `An error occurred while getting the limit for the query; using default limit of ${DEFAULT_VALUES.DEFAULT_LIST_QUERY_LIMIT}`
      );
    });
  });

  describe('sort', () => {
    it('should convert the sort args into a mongo sort object', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.sort = [
        { field: 'firstName', direction: 'ASC' },
        { field: 'createdAt', direction: 'DESC' },
      ];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: DEFAULT_VALUES.DEFAULT_LIST_QUERY_LIMIT,
        skip: 0,
        sort: { firstName: 1, createdAt: -1 },
      });
    });

    it('should not add a sort option when the sort args are an empty array', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.sort = [];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      const [, , queryOptions] = findMock.mock.calls[0] as [
        unknown,
        unknown,
        Record<string, unknown>,
      ];
      expect(queryOptions).not.toHaveProperty('sort');
    });

    it('should not add a sort option when the sort args are not an array', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.sort = {
        field: 'firstName',
        direction: 'ASC',
      } as unknown as Record<string, unknown>[];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      const [, , queryOptions] = findMock.mock.calls[0] as [
        unknown,
        unknown,
        Record<string, unknown>,
      ];
      expect(queryOptions).not.toHaveProperty('sort');
    });
  });

  describe('pagination', () => {
    it('should skip the number of documents held in the nextToken', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.limit = 2;
      initialisationParams.args.nextToken = JSON.stringify({ skip: 6 });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const result = await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: 2,
        skip: 6,
      });
      expect(result?.nextToken).toBe(JSON.stringify({ skip: 8 }));
    });

    it('should ignore a nextToken whose skip value is not a number', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.args.nextToken = JSON.stringify({ skip: '6' });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: DEFAULT_VALUES.DEFAULT_LIST_QUERY_LIMIT,
        skip: 0,
      });
    });

    it('should ignore a nextToken that is not valid JSON and warn', async () => {
      // Arrange
      const { initialisationParams, findMock, logger } = getTestSetup();
      initialisationParams.args.nextToken = 'notValidJson';

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: DEFAULT_VALUES.DEFAULT_LIST_QUERY_LIMIT,
        skip: 0,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'An error occurred while decoding the next token; using default next token values'
      );
    });

    it('should return a nextToken when a full page of documents is returned', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      initialisationParams.args.limit = 2;

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const result = await resolver.list();

      // Assert
      expect(result?.results).toHaveLength(2);
      expect(result?.nextToken).toBe(JSON.stringify({ skip: 2 }));
    });

    it('should not return a nextToken when fewer documents than the limit are returned', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      initialisationParams.args.limit = 10;

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const result = await resolver.list();

      // Assert
      expect(result?.nextToken).toBeNull();
    });

    it('should not return a nextToken when no documents are returned', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup({ documents: [] });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const result = await resolver.list();

      // Assert
      expect(result).toEqual({ results: [], nextToken: null });
    });

    it('should return an empty results array when the database returns no documents at all', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup({ documents: null });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const result = await resolver.list();

      // Assert
      expect(result).toEqual({ results: [], nextToken: null });
    });

    it('should return a null nextToken when the token cannot be encoded', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup({ withLogger: false });
      initialisationParams.args.limit = 2;
      const stringifySpy = jest
        .spyOn(JSON, 'stringify')
        .mockImplementation(() => {
          throw new Error('stringify is unavailable');
        });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      let result: ListReturn | null;
      try {
        result = await resolver.list();
      } finally {
        stringifySpy.mockRestore();
      }

      // Assert
      expect(result?.results).toHaveLength(2);
      expect(result?.nextToken).toBeNull();
    });
  });

  describe('document authorisation', () => {
    it('should remove the fields the caller is not permitted to read from every document', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      initialisationParams.getPermittedFieldsForDocument = jest.fn(
        async () => new Set(['firstName'])
      );

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const result = await resolver.list();

      // Assert
      const users = getStandardUsers();
      expect(result?.results).toEqual([
        { id: users[0].id, firstName: users[0].firstName },
        { id: users[1].id, firstName: users[1].firstName },
      ]);
    });

    it('should apply the permitted fields for each document individually', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const users = getStandardUsers();
      initialisationParams.getPermittedFieldsForDocument = jest.fn(
        async (_context: unknown, document: TestUser) =>
          document.id === users[0].id
            ? new Set(['firstName'])
            : new Set(['email'])
      );

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const result = await resolver.list();

      // Assert
      expect(result?.results).toEqual([
        { id: users[0].id, firstName: users[0].firstName },
        { id: users[1].id, email: users[1].email },
      ]);
    });
  });

  describe('hook in points', () => {
    it('should run every list hook in point in the documented order', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const calledHookPoints: HookInNames[] = [];
      const orderedHookPoints = [
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
      ];
      initialisationParams.hookInFiles = orderedHookPoints.map((hookPoint) =>
        makeHookInFile(
          hookPoint,
          jest.fn<HookInFunction>().mockImplementation(async () => {
            calledHookPoints.push(hookPoint);
          })
        )
      );

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(calledHookPoints).toEqual(orderedHookPoints);
    });

    it('should pass the fetched database documents to the postFetch hook', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const postFetchHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(HookInNames.POST_FETCH, postFetchHook),
      ];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      const documents = postFetchHook.mock.calls[0][4] as TestUser[];
      expect(documents).toHaveLength(2);
      expect(documents[0]).toEqual(
        expect.objectContaining({ id: getStandardUsers()[0].id })
      );
    });

    it('should pass the authorised results to the final hook', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const finalHook = jest.fn<HookInFunction>();
      initialisationParams.getPermittedFieldsForDocument = jest.fn(
        async () => new Set(['firstName'])
      );
      initialisationParams.hookInFiles = [
        makeHookInFile(HookInNames.FINAL, finalHook),
      ];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      const users = getStandardUsers();
      expect(finalHook.mock.calls[0][4]).toEqual([
        { id: users[0].id, firstName: users[0].firstName },
        { id: users[1].id, firstName: users[1].firstName },
      ]);
    });

    it('should see a change made to the args in the initial hook applied to the query filter', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      const initialHook = jest
        .fn<HookInFunction>()
        .mockImplementation(async (_parent, args) => {
          (args as ListArgs).limit = 3;
        });
      initialisationParams.hookInFiles = [
        makeHookInFile(HookInNames.INITIAL, initialHook),
      ];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      await resolver.list();

      // Assert
      expect(initialHook).toHaveBeenCalledTimes(1);
      expect(findMock).toHaveBeenCalledWith(expect.anything(), undefined, {
        limit: 3,
        skip: 0,
      });
    });
  });

  describe('errors', () => {
    it('should throw a NoArchitecturalAccessError when architectural authorisation fails', async () => {
      // Arrange
      const { initialisationParams, findMock } = getTestSetup();
      initialisationParams.architecturalAuthorisation = jest.fn(
        async () => false
      );

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const action = async () => await resolver.list();

      // Assert
      await expect(action).rejects.toThrow(
        `Caller does not have permission to perform the ${RESOLVER_NAME.READ} operation on ${DEFAULT_VALUES.TEST_MODEL_NAME}`
      );
      expect(findMock).toHaveBeenCalledTimes(0);
    });

    it('should rethrow a GraphQLError without wrapping it and run the error hooks', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const errorHook = jest.fn<HookInFunction>();
      initialisationParams.architecturalAuthorisation = jest.fn(
        async () => false
      );
      initialisationParams.hookInFiles = [
        makeHookInFile(HookInNames.ERROR, errorHook),
      ];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const thrownError = await resolver.list().catch((err) => err);

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).extensions.code).toBe(
        'NO_ARCHITECTURAL_ACCESS'
      );
      expect(errorHook).toHaveBeenCalledTimes(1);
      expect(errorHook.mock.calls[0][4]).toBeNull();
    });

    it('should wrap a non GraphQLError in a GraphQLError and log the message', async () => {
      // Arrange
      const { initialisationParams, logger } = getTestSetup();
      initialisationParams.getListFilter = jest.fn(async () => {
        throw new Error('Test list filter error');
      });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const thrownError = await resolver.list().catch((err) => err);

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe(
        'Test list filter error'
      );
      expect(logger.error).toHaveBeenCalledWith('Test list filter error');
    });

    it('should log and wrap a thrown value that is not an Error', async () => {
      // Arrange
      const { initialisationParams, logger } = getTestSetup();
      initialisationParams.getListFilter = jest.fn(async () => {
        throw 'a string that is not an Error';
      });

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const thrownError = await resolver.list().catch((err) => err);

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe('An error occurred');
      expect(logger.error).toHaveBeenCalledWith('An error occurred');
    });

    it('should pass the fetched documents to the error hooks when the failure happens after the fetch', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      const errorHook = jest.fn<HookInFunction>();
      initialisationParams.hookInFiles = [
        makeHookInFile(
          HookInNames.POST_DOCUMENT_AUTHORIZE,
          jest.fn<HookInFunction>().mockImplementation(async () => {
            throw new Error('Test post document authorize error');
          })
        ),
        makeHookInFile(HookInNames.ERROR, errorHook),
      ];

      // Act
      const resolver = new MongoDbListResolver<ListArgs, TestUser, ListReturn>(
        initialisationParams
      );
      const action = async () => await resolver.list();

      // Assert
      await expect(action).rejects.toThrow(
        'Test post document authorize error'
      );
      expect(errorHook).toHaveBeenCalledTimes(1);
      expect(errorHook.mock.calls[0][4]).toHaveLength(2);
    });
  });
});
