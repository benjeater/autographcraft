import { join } from 'path';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';

export function getTypesDirectory(
  currentWorkingDirectory: string,
  configuration: AutoGraphCraftConfiguration
): string {
  const { generatedTypesDirectory } = configuration;
  return join(currentWorkingDirectory, generatedTypesDirectory);
}
