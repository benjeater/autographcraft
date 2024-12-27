import type { OutputFileDetail } from '@autographcraft/core';
import type { AutoGraphCraftApiResponse } from '../types';

/**
 * Fetches the content of a signed URL and parses it into an array of OutputFileDetail
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

  return files;
}
