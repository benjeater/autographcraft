import { jest, describe, it, expect } from '@jest/globals';
import { GraphQLError } from 'graphql';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import { MongoDbUpdateResolver } from '../MongoDbUpdateResolver';
import type { HookInFunction } from '../../types';
import {
  DEFAULT_VALUES,
  getStandardUser,
  getTestSetup,
} from './MongoDbUpdateResolver.data';

describe('MongoDbUpdateResolver', () => {
  it('should be defined', () => {
    expect(MongoDbUpdateResolver).toBeDefined();
  });

  it('should update a document without any hooks or auth failures', async () => {
    // Arrange
    const { initialisationParams, findOneMock, saveMock } = getTestSetup();

    // Act
    const resolver = new MongoDbUpdateResolver(initialisationParams);
    const result = await resolver.update();

    // Assert
    expect(findOneMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({ firstName: 'updatedFirstName' })
    );
  });

  it('should call the preValidateDocument and postValidateDocument hooks', async () => {
    // Arrange
    const { initialisationParams } = getTestSetup();
    const preValidateDocumentHook = jest.fn<HookInFunction>();
    const postValidateDocumentHook = jest.fn<HookInFunction>();

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.PRE_VALIDATE_DOCUMENT,
        defaultFunction: preValidateDocumentHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.UPDATE,
        orderNumber: 1,
      },
      {
        hookPoint: HookInNames.POST_VALIDATE_DOCUMENT,
        defaultFunction: postValidateDocumentHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.UPDATE,
        orderNumber: 1,
      },
    ];

    // Act
    const resolver = new MongoDbUpdateResolver(initialisationParams);
    await resolver.update();

    // Assert
    expect(preValidateDocumentHook).toHaveBeenCalledTimes(1);
    expect(postValidateDocumentHook).toHaveBeenCalledTimes(1);
  });

  it('should run the validate document hooks either side of the document validation', async () => {
    // Arrange
    const { initialisationParams, validateMock } = getTestSetup();
    const preValidateDocumentHook = jest.fn<HookInFunction>();
    const postValidateDocumentHook = jest.fn<HookInFunction>();

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.PRE_VALIDATE_DOCUMENT,
        defaultFunction: preValidateDocumentHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.UPDATE,
        orderNumber: 1,
      },
      {
        hookPoint: HookInNames.POST_VALIDATE_DOCUMENT,
        defaultFunction: postValidateDocumentHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.UPDATE,
        orderNumber: 1,
      },
    ];

    // Act
    const resolver = new MongoDbUpdateResolver(initialisationParams);
    await resolver.update();

    // Assert
    const preValidateOrder =
      preValidateDocumentHook.mock.invocationCallOrder[0];
    const validateOrder = validateMock.mock.invocationCallOrder[0];
    const postValidateOrder =
      postValidateDocumentHook.mock.invocationCallOrder[0];

    expect(preValidateOrder).toBeLessThan(validateOrder);
    expect(validateOrder).toBeLessThan(postValidateOrder);
  });

  it('should pass the merged document to the validate document hooks', async () => {
    // Arrange
    const { initialisationParams } = getTestSetup();
    const preValidateDocumentHook = jest.fn<HookInFunction>();

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.PRE_VALIDATE_DOCUMENT,
        defaultFunction: preValidateDocumentHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.UPDATE,
        orderNumber: 1,
      },
    ];

    // Act
    const resolver = new MongoDbUpdateResolver(initialisationParams);
    await resolver.update();

    // Assert
    const documents = preValidateDocumentHook.mock.calls[0][4] as Record<
      string,
      unknown
    >[];
    expect(documents).toHaveLength(1);
    expect(documents[0]).toEqual(
      expect.objectContaining({ firstName: 'updatedFirstName' })
    );
  });

  it('should not call the postValidateDocument hook when validation fails', async () => {
    // Arrange
    const { initialisationParams, validateMock, saveMock } = getTestSetup();
    const preValidateDocumentHook = jest.fn<HookInFunction>();
    const postValidateDocumentHook = jest.fn<HookInFunction>();
    validateMock.mockRejectedValueOnce(new Error('Test validation error'));

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.PRE_VALIDATE_DOCUMENT,
        defaultFunction: preValidateDocumentHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.UPDATE,
        orderNumber: 1,
      },
      {
        hookPoint: HookInNames.POST_VALIDATE_DOCUMENT,
        defaultFunction: postValidateDocumentHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.UPDATE,
        orderNumber: 1,
      },
    ];

    // Act
    const resolver = new MongoDbUpdateResolver(initialisationParams);
    const action = async () => await resolver.update();

    // Assert
    await expect(action).rejects.toThrow('Test validation error');
    expect(preValidateDocumentHook).toHaveBeenCalledTimes(1);
    expect(postValidateDocumentHook).toHaveBeenCalledTimes(0);
    expect(saveMock).toHaveBeenCalledTimes(0);
  });

  it('should persist a change made in a preValidateDocument hook to the saved document', async () => {
    // Arrange
    const { initialisationParams, getDocumentInstance } = getTestSetup();
    const preValidateDocumentHook = jest
      .fn<HookInFunction>()
      .mockImplementation(async (...hookArgs) => {
        const documents = hookArgs[4] as Record<string, unknown>[];
        documents[0].lastName = 'setInHook';
      });

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.PRE_VALIDATE_DOCUMENT,
        defaultFunction: preValidateDocumentHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.UPDATE,
        orderNumber: 1,
      },
    ];

    // Act
    const resolver = new MongoDbUpdateResolver(initialisationParams);
    const result = await resolver.update();

    // Assert
    expect(preValidateDocumentHook).toHaveBeenCalledTimes(1);
    expect(getDocumentInstance().lastName).toBe('setInHook');
    expect(result).toEqual(expect.objectContaining({ lastName: 'setInHook' }));
  });

  describe('errors', () => {
    it('should throw an InvalidInputError when the id is not a valid MongoDB ObjectId', async () => {
      // Arrange
      const { initialisationParams, findOneMock } = getTestSetup();
      initialisationParams.args.input.id = 'notAValidObjectId';

      // Act
      const resolver = new MongoDbUpdateResolver(initialisationParams);
      const thrownError = await resolver.update().catch((err) => err);

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe(
        'id notAValidObjectId is not a valid MongoDB ObjectId'
      );
      expect((thrownError as GraphQLError).extensions.code).toBe(
        'INVALID_INPUT'
      );
      expect(findOneMock).toHaveBeenCalledTimes(0);
    });

    it('should throw a NoArchitecturalAccessError when architectural authorisation fails', async () => {
      // Arrange
      const { initialisationParams, findOneMock } = getTestSetup();
      initialisationParams.architecturalAuthorisation = jest.fn(
        async () => false
      );

      // Act
      const resolver = new MongoDbUpdateResolver(initialisationParams);
      const thrownError = await resolver.update().catch((err) => err);

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe(
        `Caller does not have permission to perform the ${RESOLVER_NAME.UPDATE} operation on ${DEFAULT_VALUES.TEST_MODEL_NAME}`
      );
      expect(findOneMock).toHaveBeenCalledTimes(0);
    });

    it('should throw a NotFoundError when the document does not exist', async () => {
      // Arrange
      const { initialisationParams, findOneMock, saveMock } = getTestSetup();
      findOneMock.mockResolvedValueOnce(null);

      // Act
      const resolver = new MongoDbUpdateResolver(initialisationParams);
      const thrownError = await resolver.update().catch((err) => err);

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe(
        `Document with id ${DEFAULT_VALUES.TEST_DOCUMENT_ID} does not exist, or has already been deleted`
      );
      expect((thrownError as GraphQLError).extensions.code).toBe('NOT_FOUND');
      expect(saveMock).toHaveBeenCalledTimes(0);
    });

    it('should throw a NotAuthorisedError when document authorisation fails and pass the fetched document to the error hooks', async () => {
      // Arrange
      const { initialisationParams, saveMock } = getTestSetup();
      const errorHook = jest.fn<HookInFunction>();
      initialisationParams.documentAuthorisation = jest.fn(async () => false);
      initialisationParams.hookInFiles = [
        {
          hookPoint: HookInNames.ERROR,
          defaultFunction: errorHook,
          filename: 'testFileHook',
          resolverName: RESOLVER_NAME.UPDATE,
          orderNumber: 1,
        },
      ];

      // Act
      const resolver = new MongoDbUpdateResolver(initialisationParams);
      const thrownError = await resolver.update().catch((err) => err);

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe(
        `Caller does not have permission to access document with id ${DEFAULT_VALUES.TEST_DOCUMENT_ID}`
      );
      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(errorHook).toHaveBeenCalledTimes(1);
      expect(errorHook.mock.calls[0][4]).toEqual([getStandardUser()]);
    });

    it('should wrap a thrown value that is not an Error in a generic GraphQLError', async () => {
      // Arrange
      const { initialisationParams } = getTestSetup();
      initialisationParams.architecturalAuthorisation = jest.fn(async () => {
        throw 'a string that is not an Error';
      });

      // Act
      const resolver = new MongoDbUpdateResolver(initialisationParams);
      const thrownError = await resolver.update().catch((err) => err);

      // Assert
      expect(thrownError).toBeInstanceOf(GraphQLError);
      expect((thrownError as GraphQLError).message).toBe('An error occurred');
    });
  });
});
