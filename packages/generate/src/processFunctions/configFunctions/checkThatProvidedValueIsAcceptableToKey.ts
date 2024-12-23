import { DATABASE_CODES, logger } from '@autographcraft/core';

const ENUM_FIELDS = {
  databaseType: DATABASE_CODES,
};

/**
 * Checks if the key being set can accept the value being set
 * @param keyToSet The key being set
 * @param valueToSet The value the key is being set to
 * @returns `true` if acceptable, `false`, if not.
 */
export function checkThatProvidedValueIsAcceptableToKey(
  keyToSet: string,
  valueToSet: string
): boolean {
  if (!Object.keys(ENUM_FIELDS).includes(keyToSet)) {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enums: string[] = (ENUM_FIELDS as any)[keyToSet as any];

  if (!enums.includes(valueToSet)) {
    logger.warn(
      `Unable to set ${keyToSet} to ${valueToSet}; acceptable values: [${enums.join(
        ', '
      )}]`
    );
    return false;
  }
  return true;
}
