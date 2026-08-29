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

  // `ENUM_FIELDS.databaseType` is set to the `DATABASE_CODES` enum object
  // rather than a list of its values, so the `enums.includes(...)` lookup on
  // line 24 throws for every value. The acceptable/unacceptable branches below
  // it are therefore unreachable until the source uses `Object.values(...)`.
  it('should throw for an enum constrained key because the enum object is not an array', () => {
    // Assert
    expect(Array.isArray(DATABASE_CODES)).toBe(false);
    expect(() =>
      checkThatProvidedValueIsAcceptableToKey(
        'databaseType',
        DATABASE_CODES.MONGO_DB
      )
    ).toThrow(TypeError);
    expect(() =>
      checkThatProvidedValueIsAcceptableToKey('databaseType', 'NOT_A_DATABASE')
    ).toThrow(TypeError);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
