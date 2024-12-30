/* eslint-disable @typescript-eslint/no-explicit-any */

import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import { MongoDbCreateResolver } from '../MongoDbCreateResolver';
import {
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
    initialisationParams.documentAuthorisation = jest
      .fn()
      .mockReturnValue(false);

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
    const preValidateHook = jest.fn();
    const postValidateHook = jest.fn();

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
    const initialHook = jest.fn().mockImplementation((_parent, args) => {
      args.input.testField = 'test';
    });
    const preValidateHook = jest.fn().mockImplementation();

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
    const initialHook = jest.fn().mockImplementation();
    const preValidateHook = jest.fn().mockImplementation();

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
});
