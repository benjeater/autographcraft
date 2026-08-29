import { sep } from 'path';
import type { OutputFileDetail } from '@autographcraft/core';
import type { AutoGraphCraftApiResponse } from '../types';

/**
 * Fetches the content of a signed URL and parses it into an array of OutputFileDetail
 *
 * The API returns root-anchored paths that always use forward slashes, so they
 * are normalised here, at the boundary where the files enter the package. Every
 * consumer writes `filePath` straight to the file system, so this has to happen
 * before the files are handed on.
 *
 * @returns An array of OutputFileDetail
 */
export async function getFilesFromResponse(
  apiResponse: AutoGraphCraftApiResponse
): Promise<OutputFileDetail[]> {
  const response = await fetch(apiResponse.signedUrl);
  if (response.status >= 400) {
    throw new Error(await response.text());
  }
  const fileString = await response.text();

  const files: OutputFileDetail[] = JSON.parse(fileString);
  if (!Array.isArray(files)) {
    throw new Error('The signed URL did not return an array of files');
  }

  return files.map((file) => ({
    ...file,
    filePath: file.filePath.replace(/^\//, '').replaceAll('/', sep),
  }));
}
