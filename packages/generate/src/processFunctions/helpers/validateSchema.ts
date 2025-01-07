import { MergedTypeDef, logger } from '@autographcraft/core';
import { generate } from '@graphql-codegen/cli';
import type { Types } from '@graphql-codegen/plugin-helpers';
import { getPackageAndCustomScalars } from '../../helpers';

export enum ValidationResult {
  VALID = 'VALID',
  INVALID = 'INVALID',
}

export async function validateSchema(
  schema: MergedTypeDef
): Promise<ValidationResult> {
  try {
    // Test Schema
    const generateCodeGenConfig: Types.Config = {
      overwrite: true,
      schema: schema.printableTypeDefs,
      silent: true,
      errorsOnly: true,
      generates: {
        'validate.ts': {
          plugins: ['typescript'],
          config: {
            scalars: getPackageAndCustomScalars(),
          },
        },
      },
    };
    await generate(generateCodeGenConfig, false);

    logger.info('✅ Schema validation passed');
    return ValidationResult.VALID;
  } catch (err) {
    logger.error('❌ Schema validation failed');
    if (!(err instanceof Error)) {
      return ValidationResult.INVALID;
    }
    const sanitisedMessage = sanitiseErrorMessage(
      err.message,
      schema.printableTypeDefs
    );

    // console.log('err: -->', sanitisedMessage, '<--');
    logger.error(sanitisedMessage);
    logger.warn('ℹ️  Please check the schema and try again');
    logger.warn(
      'ℹ️  There may be other errors present in the schema, but only the first error is shown'
    );
    return ValidationResult.INVALID;
  }
}

/**
 * Extracts the core message from the schema validation error message
 * @param message The error message returned from the schema validation
 * @param printableTypeDefs
 * @returns
 */
function sanitiseErrorMessage(message: string, printableTypeDefs: string) {
  const preamble = 'Failed to load schema from';
  const leadInRemovedMessage = message
    .replace(preamble, '')
    .replace(printableTypeDefs, '');

  const startsAtErrorMessage = leadInRemovedMessage
    .replace(/^\s*:\s*/gm, '')
    .trim();
  return startsAtErrorMessage.split('\n')[0];
}
