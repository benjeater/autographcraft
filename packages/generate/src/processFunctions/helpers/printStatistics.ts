import type { OutputFileDetail } from '@autographcraft/core';
import { logger } from '@autographcraft/core';

export type PrintStatisticsParams = {
  outputFiles: OutputFileDetail[];
  isDryRun: boolean;
  startTime: bigint;
  verbose?: boolean;
};

/**
 * Prints statistics about the generation process to the console
 * @param params The parameters for the print statistics function
 */
export function printStatistics(params: PrintStatisticsParams): void {
  const endTime = process.hrtime.bigint();
  const { outputFiles, isDryRun, startTime } = params;

  const elapsedTime = endTime - startTime;
  const readableElapsedTime = convertNanoSecondsToUserReadableTime(elapsedTime);

  logger.info('📊 Statistics:');
  logger.info(`📊 Files written: ${isDryRun ? 0 : outputFiles.length}`);
  logger.info(`📊 Time taken: ${readableElapsedTime}s`);
}

function convertNanoSecondsToUserReadableTime(nanoSeconds: bigint): string {
  const seconds = Number(nanoSeconds) / 1e9;
  return seconds.toFixed(2);
}
