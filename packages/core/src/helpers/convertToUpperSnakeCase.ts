const regex = /(?<!^)((?=[A-Z][a-z]))|((?<=[a-z])(?=[A-Z]))/g;

export function convertToUpperSnakeCase(input: string): string {
  const splitString = input.split(regex).filter(Boolean);
  if (splitString.length === 0) {
    return '';
  }
  return splitString.join('_').toUpperCase().replace(/[-]/g, '_');
}
