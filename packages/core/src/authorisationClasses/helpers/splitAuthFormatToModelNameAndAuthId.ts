/**
 * Splits an auth format string (`ModelName::id`) into its parts.
 *
 * The id is optional in the return type because a string without the `::`
 * separator has no id to give back. Every auth format string the package
 * builds comes from `convertAuthIdToAuthFormat` and always has one, so a
 * missing id means the caller was handed something it did not create.
 *
 * @param authFormat the auth format string to split
 * @returns the model name, and the id if the string contained one
 */
export function splitAuthFormatToModelNameAndAuthId(
  authFormat: string
): [string, string | undefined] {
  const [modelName, id] = authFormat.split('::');
  return [modelName, id];
}
