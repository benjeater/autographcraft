import { describe, it, expect } from '@jest/globals';
import { removeUnauthorisedFieldsFromDocument } from '../removeUnauthorisedFieldsFromDocument';
import {
  getStandardDocument,
  type TestDocument,
} from './removeUnauthorisedFieldsFromDocument.data';

describe('removeUnauthorisedFieldsFromDocument', () => {
  it('should be defined', () => {
    // Assert
    expect(removeUnauthorisedFieldsFromDocument).toBeDefined();
  });

  it('should return undefined if the document is undefined', () => {
    // Arrange
    const document = undefined;

    // Act
    const result = removeUnauthorisedFieldsFromDocument(
      document,
      new Set(['firstName'])
    );

    // Assert
    expect(result).toBeUndefined();
  });

  it('should return null if the document is null', () => {
    // Arrange
    const document = null;

    // Act
    const result = removeUnauthorisedFieldsFromDocument(
      document,
      new Set(['firstName'])
    );

    // Assert
    expect(result).toBeNull();
  });

  it('should remove the fields that are not permitted', () => {
    // Arrange
    const document = getStandardDocument();

    // Act
    const result = removeUnauthorisedFieldsFromDocument(
      document,
      new Set(['firstName', 'lastName'])
    );

    // Assert
    expect(result).toEqual({
      _id: '65d1f1c1c1c1c1c1c1c1c1c1',
      id: '65d1f1c1c1c1c1c1c1c1c1c1',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('should always keep the _id and id fields, even when they are not permitted', () => {
    // Arrange
    const document = getStandardDocument();

    // Act
    const result = removeUnauthorisedFieldsFromDocument(
      document,
      new Set<string>()
    );

    // Assert
    expect(result).toEqual({
      _id: '65d1f1c1c1c1c1c1c1c1c1c1',
      id: '65d1f1c1c1c1c1c1c1c1c1c1',
    });
  });

  it('should keep every field when all of them are permitted', () => {
    // Arrange
    const document = getStandardDocument();
    const permittedFields = new Set(Object.keys(document));

    // Act
    const result = removeUnauthorisedFieldsFromDocument(
      document,
      permittedFields
    );

    // Assert
    expect(result).toEqual(getStandardDocument());
  });

  it('should ignore permitted field names that the document does not have', () => {
    // Arrange
    const document = getStandardDocument();

    // Act
    const result = removeUnauthorisedFieldsFromDocument<TestDocument>(
      document,
      new Set(['firstName', 'aFieldThatDoesNotExist'])
    );

    // Assert
    expect(result).toEqual({
      _id: '65d1f1c1c1c1c1c1c1c1c1c1',
      id: '65d1f1c1c1c1c1c1c1c1c1c1',
      firstName: 'Ada',
    });
    expect(result).not.toHaveProperty('aFieldThatDoesNotExist');
  });

  it('should return an empty object unchanged', () => {
    // Act
    const result = removeUnauthorisedFieldsFromDocument(
      {},
      new Set(['firstName'])
    );

    // Assert
    expect(result).toEqual({});
  });
});
