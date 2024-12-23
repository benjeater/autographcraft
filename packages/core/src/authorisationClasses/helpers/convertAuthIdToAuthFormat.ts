export function convertAuthIdToAuthFormat(
  modelName: string,
  id?: string
): string {
  return `${modelName}::${id || 'ANY_ID'}`;
}
