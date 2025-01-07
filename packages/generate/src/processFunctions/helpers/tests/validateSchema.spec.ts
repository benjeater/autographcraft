/* eslint-disable @typescript-eslint/no-explicit-any */
import { validateSchema, ValidationResult } from '../validateSchema';
import { VALID_SCHEMA, INVALID_SCHEMA } from './validateSchema.data';

jest.mock('@autographcraft/core', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
  PACKAGE_SCALARS: [],
}));

describe('validateSchema', () => {
  it('should be defined', () => {
    expect(validateSchema).toBeDefined();
  });

  it('should return ValidationResult.VALID when schema is valid', async () => {
    const schema = {
      printableTypeDefs: VALID_SCHEMA,
    } as any;
    const result = await validateSchema(schema);
    expect(result).toBe(ValidationResult.VALID);
  });

  it('should return ValidationResult.INVALID when schema is invalid', async () => {
    const schema = {
      printableTypeDefs: INVALID_SCHEMA,
    } as any;
    const result = await validateSchema(schema);
    expect(result).toBe(ValidationResult.INVALID);
  });
});
