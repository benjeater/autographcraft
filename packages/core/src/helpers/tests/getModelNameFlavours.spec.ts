import { describe, it, expect } from '@jest/globals';
import { getModelNameFlavours } from '../getModelNameFlavours';

describe('getModelNameFlavours', () => {
  it('should convert a pascal case model name to every flavour', () => {
    const result = getModelNameFlavours('ThisIsATest');
    expect(result).toEqual({
      camelCase: 'thisIsATest',
      pascalCase: 'ThisIsATest',
      upperSnakeCase: 'THIS_IS_A_TEST',
    });
  });

  it('should convert a camel case model name to every flavour', () => {
    const result = getModelNameFlavours('thisIsATest');
    expect(result).toEqual({
      camelCase: 'thisIsATest',
      pascalCase: 'ThisIsATest',
      upperSnakeCase: 'THIS_IS_A_TEST',
    });
  });

  it('should convert a single word model name to every flavour', () => {
    const result = getModelNameFlavours('User');
    expect(result).toEqual({
      camelCase: 'user',
      pascalCase: 'User',
      upperSnakeCase: 'USER',
    });
  });

  it('should convert an empty model name to every flavour', () => {
    const result = getModelNameFlavours('');
    expect(result).toEqual({
      camelCase: '',
      pascalCase: '',
      upperSnakeCase: '',
    });
  });
});
