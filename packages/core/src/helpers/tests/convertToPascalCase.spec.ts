import { expect, it, describe } from '@jest/globals';
import { convertToPascalCase } from '../convertToPascalCase';

describe('convertToPascalCase', () => {
  it('should convert a lower kebab case string to pascal case', () => {
    const input = 'this-is-a-test';
    const expected = 'ThisIsATest';
    const result = convertToPascalCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a lower snake case string to pascal case', () => {
    const input = 'this_is_a_test';
    const expected = 'ThisIsATest';
    const result = convertToPascalCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert an upper snake case string to pascal case', () => {
    const input = 'THIS_IS_A_TEST';
    const expected = 'ThisIsATest';
    const result = convertToPascalCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a pascal case string to pascal case', () => {
    const input = 'ThisIsATest';
    const expected = 'ThisIsATest';
    const result = convertToPascalCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a pascal case string with capital acronym to pascal case', () => {
    const input = 'TestABCTest';
    const expected = 'TestABCTest';
    const result = convertToPascalCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a camel case string to pascal case', () => {
    const input = 'thisIsATest';
    const expected = 'ThisIsATest';
    const result = convertToPascalCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a camel case string with capital acronym to pascal case', () => {
    const input = 'testABCTest';
    const expected = 'TestABCTest';
    const result = convertToPascalCase(input);
    expect(result).toEqual(expected);
  });
});
