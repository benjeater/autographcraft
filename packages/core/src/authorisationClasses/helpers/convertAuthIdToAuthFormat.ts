/**
 * Builds the auth format string (`ModelName::id`) used as the key for every
 * entry in the authorisation id set.
 *
 * The id is required. An earlier version substituted an `ANY_ID` placeholder
 * when it was missing, which made the key for "a root id was not provided"
 * identical to the key looked up for "is this caller authorised for this model
 * generally" - so a missing root id granted a match instead of denying one.
 * Callers that have no id must not build a key at all.
 *
 * @param modelName the name of the model the id belongs to
 * @param id the id of the document
 * @returns the auth format string
 */
export function convertAuthIdToAuthFormat(
  modelName: string,
  id: string
): string {
  return `${modelName}::${id}`;
}
