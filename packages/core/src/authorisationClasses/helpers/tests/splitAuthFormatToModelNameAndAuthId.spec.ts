import { describe, it, expect } from '@jest/globals';
import { splitAuthFormatToModelNameAndAuthId } from '../splitAuthFormatToModelNameAndAuthId';

describe('splitAuthFormatToModelNameAndAuthId', () => {
  it('should split an auth format string into the model name and the id', () => {
    const result = splitAuthFormatToModelNameAndAuthId('TestModel::1234');
    expect(result).toEqual(['TestModel', '1234']);
  });

  it('should return an undefined id when there is no separator', () => {
    const result = splitAuthFormatToModelNameAndAuthId('TestModel');
    expect(result).toEqual(['TestModel', undefined]);
  });
});
