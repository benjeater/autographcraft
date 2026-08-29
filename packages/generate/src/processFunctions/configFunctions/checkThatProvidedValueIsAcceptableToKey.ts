import { DATABASE_CODES, logger } from '@autographcraft/core';

const ENUM_FIELDS: Record<string, string[]> = {
  databaseType: Object.values(DATABASE_CODES),
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

  const enums = ENUM_FIELDS[keyToSet];

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
