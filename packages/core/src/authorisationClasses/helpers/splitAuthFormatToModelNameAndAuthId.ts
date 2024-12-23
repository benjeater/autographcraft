export function splitAuthFormatToModelNameAndAuthId(
  authFormat: string
): [string, string] {
  const [modelName, id] = authFormat.split('::');
  return [modelName, id];
}
