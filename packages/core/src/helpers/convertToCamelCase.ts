const regex = /[-_\s][\w]/g;

export function convertToCamelCase(input: string): string {
  let inputCopy = `${input}`;
  // If the input satisifies the upper snake case regex, convert it to lower snake case
  if (input.match(/^[A-Z_]+$/)) {
    inputCopy = input.toLowerCase();
  }

  const firstCharacter = inputCopy.charAt(0).toLowerCase();
  const restOfTheString = inputCopy.slice(1);
  const restOfStringToCamelCase = restOfTheString.replace(regex, replacer);
  return `${firstCharacter}${restOfStringToCamelCase}`.replace(/[-_\s]/g, '');
}

function replacer(match: string) {
  const lowerCaseString = match.toLowerCase();
  const firstCharacter = lowerCaseString.charAt(0);
  const secondCharacter = lowerCaseString.charAt(1).toUpperCase();
  const restOfString = lowerCaseString.slice(2);
  const returnString = `${firstCharacter}${secondCharacter}${restOfString}`;
  return returnString;
}
