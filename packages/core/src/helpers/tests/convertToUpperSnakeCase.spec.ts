import { expect, it, describe } from '@jest/globals';
import { convertToUpperSnakeCase } from '../convertToUpperSnakeCase';

describe('convertToUpperSnakeCase', () => {
  it('should convert a lower kebab case string to upper snake case', () => {
    const input = 'this-is-a-test';
    const expected = 'THIS_IS_A_TEST';
    const result = convertToUpperSnakeCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a lower snake case string to upper snake case', () => {
    const input = 'this_is_a_test';
    const expected = 'THIS_IS_A_TEST';
    const result = convertToUpperSnakeCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert an upper snake case string to upper snake case', () => {
    const input = 'THIS_IS_A_TEST';
    const expected = 'THIS_IS_A_TEST';
    const result = convertToUpperSnakeCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a pascal case string to upper snake case', () => {
    const input = 'ThisIsATest';
    const expected = 'THIS_IS_A_TEST';
    const result = convertToUpperSnakeCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a pascal case string with capital acronym to upper snake case', () => {
    const input = 'TestABCTest';
    const expected = 'TEST_ABC_TEST';
    const result = convertToUpperSnakeCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a camel case string to upper snake case', () => {
    const input = 'thisIsATest';
    const expected = 'THIS_IS_A_TEST';
    const result = convertToUpperSnakeCase(input);
    expect(result).toEqual(expected);
  });

  it('should convert a camel case string with capital acronym to upper snake case', () => {
    const input = 'testABCTest';
    const expected = 'TEST_ABC_TEST';
    const result = convertToUpperSnakeCase(input);
    expect(result).toEqual(expected);
  });
});
