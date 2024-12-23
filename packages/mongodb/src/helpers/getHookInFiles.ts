import { basename, join } from 'path';
import { readdirSync, existsSync } from 'fs';
import { HookInNames } from '@autographcraft/core';
import type { ExtendedResolverType } from '@autographcraft/core';
import type { HookInFile } from '../resolverClasses/types';

/**
 * Reads all the files in the given directory and returns an array of HookInFile objects
 * @param directoryPath The path to the directory to search for hook in files
 * @returns
 */
export async function getHookInFiles(
  directoryPath: string
): Promise<HookInFile[]> {
  // Read files in the directory that match the model
  const options = {
    recursive: true,
  };
  const directoryExists = existsSync(directoryPath);
  if (!directoryExists) {
    return [];
  }

  const hookInDirectoryFilenames = readdirSync(
    directoryPath,
    options
  ) as string[];

  // Filter the files to only include .ts and .js files
  const hookInFiles = hookInDirectoryFilenames.filter((filename) => {
    return filename.endsWith('.ts') || filename.endsWith('.js');
  });

  const returnArray: HookInFile[] = [];
  for (const filename of hookInFiles) {
    const { resolverName, hookPoint, orderNumber } =
      splitFilenameIntoHookInFileParts(filename);
    const importedModule = await import(
      join(directoryPath, filename).replace('.ts', '.js')
    );
    const defaultFunction = importedModule.default;

    returnArray.push({
      filename,
      resolverName,
      hookPoint,
      orderNumber,
      defaultFunction,
    });
  }

  return returnArray;
}

function splitFilenameIntoHookInFileParts(
  filename: string
): Pick<HookInFile, 'resolverName' | 'hookPoint' | 'orderNumber'> {
  let parts: string[] = [];
  if (filename.endsWith('.ts')) {
    parts = basename(filename, '.ts').split('-');
  }
  if (filename.endsWith('.js')) {
    parts = basename(filename, '.js').split('-');
  }

  const resolverName = parts[0] as ExtendedResolverType;
  const hookPoint = parts[1] as HookInNames;

  if (parts.length !== 3) {
    return { resolverName, hookPoint, orderNumber: 0 };
  }

  if (isNaN(parseInt(parts[2]))) {
    return { resolverName, hookPoint, orderNumber: 0 };
  }

  const orderNumber = parseInt(parts[2]);

  return { resolverName, hookPoint, orderNumber };
}
