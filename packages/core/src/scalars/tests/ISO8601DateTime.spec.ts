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
});
