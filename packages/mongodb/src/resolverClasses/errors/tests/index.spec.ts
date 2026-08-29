import { describe, it, expect } from '@jest/globals';
import { GraphQLError } from 'graphql';
import {
  InvalidInputError,
  NotFoundError,
  NoArchitecturalAccessError,
  NotAuthorisedError,
} from '../index';

describe('errors', () => {
  describe('InvalidInputError', () => {
    it('should be a GraphQLError with the INVALID_INPUT code', () => {
      // Act
      const error = new InvalidInputError('The id argument is not a valid id');

      // Assert
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.message).toBe('The id argument is not a valid id');
      expect(error.extensions).toEqual({ code: 'INVALID_INPUT' });
    });

    it('should merge any additional extensions into the extensions', () => {
      // Act
      const error = new InvalidInputError('Invalid input', {
        fieldName: 'id',
      });

      // Assert
      expect(error.extensions).toEqual({
        code: 'INVALID_INPUT',
        fieldName: 'id',
      });
    });
  });

  describe('NotFoundError', () => {
    it('should be a GraphQLError with the NOT_FOUND code', () => {
      // Act
      const error = new NotFoundError('No User found with that id');

      // Assert
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.message).toBe('No User found with that id');
      expect(error.extensions).toEqual({ code: 'NOT_FOUND' });
    });

    it('should merge any additional extensions into the extensions', () => {
      // Act
      const error = new NotFoundError('Not found', { modelName: 'User' });

      // Assert
      expect(error.extensions).toEqual({
        code: 'NOT_FOUND',
        modelName: 'User',
      });
    });
  });

  describe('NoArchitecturalAccessError', () => {
    it('should build the message from the model name and operation', () => {
      // Act
      const error = new NoArchitecturalAccessError('User', 'create');

      // Assert
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.message).toBe(
        'Caller does not have permission to perform the create operation on User'
      );
      expect(error.extensions).toEqual({ code: 'NO_ARCHITECTURAL_ACCESS' });
    });

    it('should merge any additional extensions into the extensions', () => {
      // Act
      const error = new NoArchitecturalAccessError('User', 'delete', {
        callerId: '12345',
      });

      // Assert
      expect(error.extensions).toEqual({
        code: 'NO_ARCHITECTURAL_ACCESS',
        callerId: '12345',
      });
    });
  });

  describe('NotAuthorisedError', () => {
    it('should be a GraphQLError with the NOT_AUTHORISED code', () => {
      // Act
      const error = new NotAuthorisedError('Caller is not authorised');

      // Assert
      expect(error).toBeInstanceOf(GraphQLError);
      expect(error.message).toBe('Caller is not authorised');
      expect(error.extensions).toEqual({ code: 'NOT_AUTHORISED' });
    });

    it('should merge any additional extensions into the extensions', () => {
      // Act
      const error = new NotAuthorisedError('Not authorised', {
        callerId: '12345',
      });

      // Assert
      expect(error.extensions).toEqual({
        code: 'NOT_AUTHORISED',
        callerId: '12345',
      });
    });
  });

  it('should let a supplied code extension override the default code', () => {
    // Arrange / Act
    const error = new InvalidInputError('Invalid input', {
      code: 'A_CUSTOM_CODE',
    });

    // Assert
    expect(error.extensions).toEqual({ code: 'A_CUSTOM_CODE' });
  });
});
