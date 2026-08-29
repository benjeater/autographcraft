import { jest, beforeEach, describe, expect, it } from '@jest/globals';

// ESM mock factories must provide every export the module graph reaches for,
// so the real core module is spread and only the logger is replaced - the real
// logger writes to a file, which a unit test must not do.
const actualCore = jest.requireActual<typeof import('@autographcraft/core')>(
  '@autographcraft/core'
);

jest.unstable_mockModule('@autographcraft/core', () => ({
  ...actualCore,
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    end: jest.fn(),
  },
}));

const { logger, DATABASE_CODES } = await import('@autographcraft/core');
const { checkThatProvidedValueIsAcceptableToKey } =
  await import('../checkThatProvidedValueIsAcceptableToKey');

describe('checkThatProvidedValueIsAcceptableToKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    // Assert
    expect(checkThatProvidedValueIsAcceptableToKey).toBeDefined();
  });

  it('should return true for a key that is not constrained to an enum', () => {
    // Act
    const result = checkThatProvidedValueIsAcceptableToKey(
      'generatedTypesDirectory',
      'src/anywhere'
    );

    // Assert
    expect(result).toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should return true for a value in the enum of a constrained key', () => {
    // Act
    const result = checkThatProvidedValueIsAcceptableToKey(
      'databaseType',
      DATABASE_CODES.MONGO_DB
    );

    // Assert
    expect(result).toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should warn and return false for a value outside the enum of a constrained key', () => {
    // Act
    const result = checkThatProvidedValueIsAcceptableToKey(
      'databaseType',
      'NOT_A_DATABASE'
    );

    // Assert
    expect(result).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      `Unable to set databaseType to NOT_A_DATABASE; acceptable values: [${Object.values(
        DATABASE_CODES
      ).join(', ')}]`
    );
  });

  it('should accept every value of the enum it constrains', () => {
    // Act / Assert
    for (const databaseCode of Object.values(DATABASE_CODES)) {
      expect(
        checkThatProvidedValueIsAcceptableToKey('databaseType', databaseCode)
      ).toBe(true);
    }
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
