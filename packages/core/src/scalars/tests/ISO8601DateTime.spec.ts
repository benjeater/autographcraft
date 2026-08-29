import { describe, it, expect } from '@jest/globals';
import { Kind, type IntValueNode, type StringValueNode } from 'graphql';
import { ISO8601DateTime } from '../ISO8601DateTime';
import {
  TEST_DATE_STRINGS_FAIL,
  TEST_DATE_STRINGS_SUCCESS,
  TEST_DATE_STRINGS_SUCCESS_SERIALIZE,
} from './ISO8601DateTime.data';

describe('ISO8601DateTime', () => {
  it('should parseValue a Date object to an ISO8601 string', () => {
    for (const [dateString, expectedDateString] of Object.entries(
      TEST_DATE_STRINGS_SUCCESS
    )) {
      expect(ISO8601DateTime.parseValue(dateString)).toEqual(
        new Date(expectedDateString)
      );
    }
  });

  it("should throw an error when parseValue is called with a value that isn't a string", () => {
    expect(() => ISO8601DateTime.parseValue(123)).toThrow(
      'GraphQL ISO8601DateTime Scalar parser expected a `string`'
    );
  });

  it('should throw an error when parseValue is called with a string that is not a valid ISO8601 date string', () => {
    for (const dateString of TEST_DATE_STRINGS_FAIL) {
      let failedTests = 0;
      try {
        expect(() => ISO8601DateTime.parseValue(dateString)).toThrow(
          'Invalid ISO8601 date string provided'
        );
      } catch (error) {
        console.debug(`parseValue - ${dateString} - ${error}`);
        failedTests += 1;
      }
      expect(failedTests).toBe(0);
    }
  });

  it('should serialize a Date object to an ISO8601 string', () => {
    for (const [dateString, expectedDateString] of Object.entries(
      TEST_DATE_STRINGS_SUCCESS_SERIALIZE
    )) {
      expect(ISO8601DateTime.serialize(new Date(dateString))).toEqual(
        expectedDateString
      );
    }
  });

  it("should throw an error when serialize is called with a value that isn't a Date", () => {
    expect(() => ISO8601DateTime.serialize('2021-01-01T12:43:54.987Z')).toThrow(
      'GraphQL ISO8601DateTime Scalar serializer expected a `Date` object'
    );
  });

  it('should parseLiteral a string AST node to a Date object', () => {
    for (const [dateString, expectedDateString] of Object.entries(
      TEST_DATE_STRINGS_SUCCESS
    )) {
      // Arrange
      const ast: StringValueNode = { kind: Kind.STRING, value: dateString };

      // Act
      const result = ISO8601DateTime.parseLiteral(ast, undefined);

      // Assert
      expect(result).toEqual(new Date(expectedDateString));
    }
  });

  it('should return null when parseLiteral is called with a non-string AST node', () => {
    // Arrange
    const ast: IntValueNode = { kind: Kind.INT, value: '123' };

    // Act
    const result = ISO8601DateTime.parseLiteral(ast, undefined);

    // Assert
    expect(result).toBeNull();
  });
});
