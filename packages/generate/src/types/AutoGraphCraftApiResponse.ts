import type { OutputFileDetail } from '@autographcraft/core';

export type AutoGraphCraftApiResponse = {
  files: OutputFileDetail[];
  executionDuration: number;
};
