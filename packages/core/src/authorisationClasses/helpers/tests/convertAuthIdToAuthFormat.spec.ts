import { describe, it, expect } from '@jest/globals';
import { convertAuthIdToAuthFormat } from '../convertAuthIdToAuthFormat';

describe('convertAuthIdToAuthFormat', () => {
  it('should join the model name and the id with a double colon', () => {
    const result = convertAuthIdToAuthFormat('TestModel', '1234');
    expect(result).toEqual('TestModel::1234');
  });

  it('should use ANY_ID when no id is provided', () => {
    const result = convertAuthIdToAuthFormat('TestModel');
    expect(result).toEqual('TestModel::ANY_ID');
  });

  it('should use ANY_ID when the id is an empty string', () => {
    const result = convertAuthIdToAuthFormat('TestModel', '');
    expect(result).toEqual('TestModel::ANY_ID');
  });
});
