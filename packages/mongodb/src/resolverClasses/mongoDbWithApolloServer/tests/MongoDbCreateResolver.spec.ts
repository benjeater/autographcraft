import { jest, describe, it, expect } from '@jest/globals';
import { GraphQLError } from 'graphql';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import { MongoDbCreateResolver } from '../MongoDbCreateResolver';
import type { HookInFunction } from '../../types';
import {
  DEFAULT_VALUES,
  getDatabaseModelImplementationSave,
  getDatabaseModelImplementationValidate,
  getInitialisationParams,
  getStandardUser,
  getStandardUserInput,
} from './MongoDbCreateResolver.data';

describe('MongoDbCreateResolver', () => {
  it('should be defined', () => {
    expect(MongoDbCreateResolver).toBeDefined();
  });

  it('should create a new document without any hooks or auth failures', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    const databaseModelImplementationSave =
      getDatabaseModelImplementationSave();

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    const result = await resolver.create();

    // Assert
    expect(initialisationParams.databaseModel).toHaveBeenCalledTimes(1);
    expect(initialisationParams.databaseModel).toHaveBeenCalledWith(
      getStandardUserInput()
    );
    expect(initialisationParams.databaseModel.create).toHaveBeenCalledTimes(0);
    expect(databaseModelImplementationSave).toHaveBeenCalledTimes(1);
    expect(result).toEqual(getStandardUser());
  });

  it('should throw an error if the user does not have permission to create a document', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    initialisationParams.documentAuthorisation = jest.fn(async () => false);

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    const action = async () => await resolver.create();

    // Assert
    await expect(action).rejects.toThrow(
      `Caller does not have permission to create a document with the provided input`
    );
  });

  it('should throw an error if the document validation fails', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    const databaseModelImplementationValidate =
      getDatabaseModelImplementationValidate();
    databaseModelImplementationValidate.mockRejectedValueOnce(
      new Error('Test error')
    );

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    const action = async () => await resolver.create();

    // Assert
    await expect(action).rejects.toThrow('Test error');
  });

  it('should call the appropriate hooks', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    const preValidateHook = jest.fn<HookInFunction>();
    const postValidateHook = jest.fn<HookInFunction>();

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.PRE_VALIDATE_DOCUMENT,
        defaultFunction: preValidateHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.CREATE,
        orderNumber: 1,
      },
    ];

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    await resolver.create();

    // Assert
    expect(preValidateHook).toHaveBeenCalledTimes(1);
    expect(postValidateHook).toHaveBeenCalledTimes(0);
  });

  it('should have data added in a hook persist through to the final document', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    const initialHook = jest
      .fn<HookInFunction>()
      .mockImplementation(async (_parent, args) => {
        (args as { input: Record<string, unknown> }).input.testField = 'test';
      });
    const preValidateHook = jest.fn<HookInFunction>();

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.INITIAL,
        defaultFunction: initialHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.CREATE,
        orderNumber: 1,
      },
      {
        hookPoint: HookInNames.PRE_VALIDATE_ARGS,
        defaultFunction: preValidateHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.CREATE,
        orderNumber: 1,
      },
    ];

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    await resolver.create();

    // Assert
    expect(initialHook).toHaveBeenCalledTimes(1);
    expect(preValidateHook).toHaveBeenCalledTimes(1);
    expect(initialHook).toHaveBeenCalledWith(
      initialisationParams.parent,
      initialisationParams.args,
      initialisationParams.context,
      initialisationParams.info,
      null
    );
    expect(preValidateHook).toHaveBeenCalledWith(
      initialisationParams.parent,
      { input: { ...getStandardUserInput(), testField: 'test' } },
      initialisationParams.context,
      initialisationParams.info,
      null
    );
  });

  it('should have data in the args that is not permitted removed after the initial hook', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    const initialHook = jest.fn<HookInFunction>();
    const preValidateHook = jest.fn<HookInFunction>();

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.INITIAL,
        defaultFunction: initialHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.CREATE,
        orderNumber: 1,
      },
      {
        hookPoint: HookInNames.PRE_VALIDATE_ARGS,
        defaultFunction: preValidateHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.CREATE,
        orderNumber: 1,
      },
    ];

    initialisationParams.args.input = {
      ...getStandardUserInput(),
      notAllowedField: 'notAllowedField',
    };

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    await resolver.create();

    // Assert
    expect(initialHook).toHaveBeenCalledTimes(1);
    expect(preValidateHook).toHaveBeenCalledTimes(1);
    expect(initialHook).toHaveBeenCalledWith(
      initialisationParams.parent,
      initialisationParams.args,
      initialisationParams.context,
      initialisationParams.info,
      null
    );
    expect(preValidateHook).toHaveBeenCalledWith(
      initialisationParams.parent,
      { input: getStandardUserInput() },
      initialisationParams.context,
      initialisationParams.info,
      null
    );
  });

  it('should throw a NoArchitecturalAccessError when architectural authorisation fails', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    initialisationParams.architecturalAuthorisation = jest.fn(
      async () => false
    );

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    const thrownError = await resolver.create().catch((err) => err);

    // Assert
    expect(thrownError).toBeInstanceOf(GraphQLError);
    expect((thrownError as GraphQLError).message).toBe(
      `Caller does not have permission to perform the ${RESOLVER_NAME.CREATE} operation on ${DEFAULT_VALUES.TEST_MODEL_NAME}`
    );
    expect((thrownError as GraphQLError).extensions.code).toBe(
      'NO_ARCHITECTURAL_ACCESS'
    );
  });

  it('should wrap a thrown value that is not an Error in a generic GraphQLError', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    initialisationParams.architecturalAuthorisation = jest.fn(async () => {
      throw 'a string that is not an Error';
    });

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    const thrownError = await resolver.create().catch((err) => err);

    // Assert
    expect(thrownError).toBeInstanceOf(GraphQLError);
    expect((thrownError as GraphQLError).message).toBe('An error occurred');
  });

  it('should pass the created document to the error hooks when the failure happens after the commit', async () => {
    // Arrange
    const initialisationParams = getInitialisationParams();
    const errorHook = jest.fn<HookInFunction>();
    const finalHook = jest.fn<HookInFunction>().mockImplementation(async () => {
      throw new Error('Test final hook error');
    });

    initialisationParams.hookInFiles = [
      {
        hookPoint: HookInNames.FINAL,
        defaultFunction: finalHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.CREATE,
        orderNumber: 1,
      },
      {
        hookPoint: HookInNames.ERROR,
        defaultFunction: errorHook,
        filename: 'testFileHook',
        resolverName: RESOLVER_NAME.CREATE,
        orderNumber: 1,
      },
    ];

    // Act
    const resolver = new MongoDbCreateResolver(initialisationParams);
    const action = async () => await resolver.create();

    // Assert
    await expect(action).rejects.toThrow('Test final hook error');
    expect(errorHook).toHaveBeenCalledTimes(1);
    expect(errorHook.mock.calls[0][4]).toEqual([getStandardUser()]);
  });
});
