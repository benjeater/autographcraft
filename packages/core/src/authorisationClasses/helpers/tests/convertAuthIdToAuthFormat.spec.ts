import { describe, it, expect } from '@jest/globals';
import { convertAuthIdToAuthFormat } from '../convertAuthIdToAuthFormat';

describe('convertAuthIdToAuthFormat', () => {
  it('should join the model name and the id with a double colon', () => {
    const result = convertAuthIdToAuthFormat('TestModel', '1234');
    expect(result).toEqual('TestModel::1234');
  });

  it('should build a distinct key for every id', () => {
    // Arrange / Act
    const first = convertAuthIdToAuthFormat('TestModel', '1234');
    const second = convertAuthIdToAuthFormat('TestModel', '5678');

    // Assert
    expect(first).not.toEqual(second);
  });

  it('should build a distinct key for the same id on different models', () => {
    // Arrange / Act
    const first = convertAuthIdToAuthFormat('TestModel', '1234');
    const second = convertAuthIdToAuthFormat('OtherTestModel', '1234');

    // Assert
    expect(first).not.toEqual(second);
  });
});
