const ignoreHeaderLinesJavascript = [
  '/* eslint-disable */',
  '// @ts-nocheck',
  '// prettier-ignore',
  '// This file has been generated by AutoGraph. Do not edit this file directly.',
  '// Any changes made to this file will be overwritten when AutoGraphCraft is next run.',
  '',
];

const ignoreHeaderLinesTypescript = [
  '/* eslint-disable */',
  '// @ts-nocheck',
  '// prettier-ignore',
  '// This file has been generated by AutoGraph. Do not edit this file directly.',
  '// Any changes made to this file will be overwritten when AutoGraphCraft is next run.',
  '',
];

const ignoreHeaderLinesGraphQl = [
  '# This file has been generated by AutoGraph. Do not edit this file directly.',
  '# Any changes made to this file will be overwritten when AutoGraphCraft is next run.',
  '',
];

/**
 * Adds the ignore header to the content provided
 * @param content The content to add the ignore header to
 * @returns
 */
export function addIgnoreHeaderToContent(
  content: string,
  fileExtension: string
): string {
  switch (fileExtension) {
    case 'js':
      return ignoreHeaderLinesJavascript.join('\n') + '\n' + content;
    case 'ts':
      return ignoreHeaderLinesTypescript.join('\n') + '\n' + content;
    case 'graphql':
      return ignoreHeaderLinesGraphQl.join('\n') + '\n' + content;
    default:
      return ignoreHeaderLinesJavascript.join('\n') + '\n' + content;
  }
}
