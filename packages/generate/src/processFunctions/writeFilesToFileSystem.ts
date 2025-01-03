import { dirname } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import type { OutputFileDetail } from '@autographcraft/core';
import { addIgnoreHeaderToContent } from './helpers';
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

    const fileExtension = filePath.split('.').pop() || '';

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
