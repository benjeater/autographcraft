import { basename, dirname } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import type { OutputFileDetail } from '@autographcraft/core';
import { addIgnoreHeaderToContent } from '../helpers';
import { logger } from '@autographcraft/core';

export function writeFilesToFileSystem(
  outputFiles: OutputFileDetail[],
  isDryRun: boolean
): void {
  if (isDryRun) {
    logger.info('ℹ️ Dry run requested, no files will be written');
    return;
  }

  outputFiles.forEach((outputFile) => {
    const { filePath, content, addIgnoreHeader, shouldOverwrite } = outputFile;

    const fileExtension = getFileExtension(filePath);

    const writableContent = addIgnoreHeader
      ? addIgnoreHeaderToContent(content, fileExtension)
      : content;

    const fileExists = existsSync(filePath);

    // If the file should not be overwritten and it already exists, skip the
    // write process
    if (!shouldOverwrite && fileExists) {
      return;
    }

    const directoryPath = dirname(filePath);
    const directoryExists = existsSync(directoryPath);

    if (!directoryExists) {
      mkdirSync(directoryPath, { recursive: true });
    }

    writeFileSync(filePath, writableContent);
    const filePathRelativeToCwd = filePath
      .replace(process.cwd(), '')
      .replace(/^\//, '');
    logger.info(`✅ File written: ${filePathRelativeToCwd}`);
  });
}

/**
 * Derives the extension of the file at the given path.
 *
 * Only text following a dot within the file name itself is treated as an
 * extension, so a path with no extension (`Makefile`), a dotfile
 * (`.gitignore`), or a path whose only dot is in a directory name
 * (`src/v1.2/Makefile`) all yield an empty string.
 *
 * @param filePath The path of the file to derive the extension from
 * @returns The file extension without the leading dot, or an empty string
 */
function getFileExtension(filePath: string): string {
  const fileName = basename(filePath);
  const lastDotIndex = fileName.lastIndexOf('.');

  // A dot at index 0 marks a dotfile (`.gitignore`), not an extension, and -1
  // means there is no dot in the file name at all
  if (lastDotIndex < 1) {
    return '';
  }

  return fileName.slice(lastDotIndex + 1);
}
