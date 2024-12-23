import { expect, it, describe } from '@jest/globals';
import { convertToCamelCase } from '../convertToCamelCase';

describe('convertToCamelCase', () => {
  it('should convert a lower kebab case string to camel case', () => {
    const input = 'this-is-a-test';
    const expected = 'thisIsATest';
    const result = convertToCamelCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a lower snake case string to camel case', () => {
    const input = 'this_is_a_test';
    const expected = 'thisIsATest';
    const result = convertToCamelCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert an upper snake case string to camel case', () => {
    const input = 'THIS_IS_A_TEST';
    const expected = 'thisIsATest';
    const result = convertToCamelCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a pascal case string to camel case', () => {
    const input = 'ThisIsATest';
    const expected = 'thisIsATest';
    const result = convertToCamelCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a pascal case string with capital acronym to camel case', () => {
    const input = 'TestABCTest';
    const expected = 'testABCTest';
    const result = convertToCamelCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a camel case string to camel case', () => {
    const input = 'thisIsATest';
    const expected = 'thisIsATest';
    const result = convertToCamelCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a camel case string with capital acronym to camel case', () => {
    const input = 'testABCTest';
    const expected = 'testABCTest';
    const result = convertToCamelCase(input);
    expect(result).toEqual(expected);
  });
});
