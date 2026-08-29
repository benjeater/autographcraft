import { jest } from '@jest/globals';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import { MongoDbUpdateResolver } from '../MongoDbUpdateResolver';
import type { HookInFunction } from '../../types';
import { getTestSetup } from './MongoDbUpdateResolver.data';

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
});
