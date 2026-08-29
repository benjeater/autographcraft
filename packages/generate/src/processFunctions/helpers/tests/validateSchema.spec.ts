/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { VALID_SCHEMA, INVALID_SCHEMA } from './validateSchema.data';

// @graphql-codegen/cli is mocked rather than run for real: codegen 7 pulls in
// yargs 18 and chalk 5, neither of which Jest's ESM loader can link. Mocking it
// also lets this suite drive `sanitiseErrorMessage` with a known codegen error
// instead of whatever the real one happens to emit.
const generate = jest.fn<() => Promise<unknown>>();

jest.unstable_mockModule('@graphql-codegen/cli', () => ({ generate }));

// ESM mock factories must provide every export the module graph reaches for -
// a missing one is a SyntaxError, not `undefined` - so spread the real module
// and override only the logger this suite needs silenced.
const actualCore = jest.requireActual<typeof import('@autographcraft/core')>(
  '@autographcraft/core'
);

jest.unstable_mockModule('@autographcraft/core', () => ({
  ...actualCore,
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const { logger } = await import('@autographcraft/core');
const { validateSchema, ValidationResult } = await import('../validateSchema');

describe('validateSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generate.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(validateSchema).toBeDefined();
  });

  it('should return ValidationResult.VALID when schema is valid', async () => {
    const schema = {
      printableTypeDefs: VALID_SCHEMA,
    } as any;

    const result = await validateSchema(schema);

    expect(result).toBe(ValidationResult.VALID);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('should pass the schema to codegen with only the typescript plugin', async () => {
    const schema = {
      printableTypeDefs: VALID_SCHEMA,
    } as any;

    await validateSchema(schema);

    const [config, shouldWatch] = generate.mock.calls[0] as any[];
    expect(shouldWatch).toBe(false);
    expect(config.schema).toBe(VALID_SCHEMA);
    expect(config.generates['validate.ts'].plugins).toEqual(['typescript']);
  });

  it('should return ValidationResult.INVALID when schema is invalid', async () => {
    generate.mockRejectedValue(
      new Error(
        `Failed to load schema from ${INVALID_SCHEMA}: \n        Unknown type: "TestEnum".\n        Some trailing detail that should not be reported`
      )
    );
    const schema = {
      printableTypeDefs: INVALID_SCHEMA,
    } as any;

    const result = await validateSchema(schema);

    expect(result).toBe(ValidationResult.INVALID);
  });

  it('should report only the first line of the codegen error, without the schema echoed back', async () => {
    generate.mockRejectedValue(
      new Error(
        `Failed to load schema from ${INVALID_SCHEMA}: \n        Unknown type: "TestEnum".\n        Some trailing detail that should not be reported`
      )
    );
    const schema = {
      printableTypeDefs: INVALID_SCHEMA,
    } as any;

    await validateSchema(schema);

    expect(logger.error).toHaveBeenCalledWith('Unknown type: "TestEnum".');
  });

  it('should return ValidationResult.INVALID when codegen rejects with a non-Error', async () => {
    generate.mockRejectedValue('not an error');
    const schema = {
      printableTypeDefs: INVALID_SCHEMA,
    } as any;

    const result = await validateSchema(schema);

    expect(result).toBe(ValidationResult.INVALID);
  });
});
