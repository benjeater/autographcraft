import { join } from 'path';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import { TYPESCRIPT_TYPES_FILE_NAME } from '@autographcraft/core';

export function getTypescriptTypesFilePath(
  currentWorkingDirectory: string,
  configuration: AutoGraphCraftConfiguration
): string {
  const { generatedTypesDirectory } = configuration;
  return join(
    currentWorkingDirectory,
    generatedTypesDirectory,
    `${TYPESCRIPT_TYPES_FILE_NAME}.ts`
  );
}
