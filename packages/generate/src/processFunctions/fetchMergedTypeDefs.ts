import { join } from 'path';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { type DocumentNode, print } from 'graphql';
import { logger } from '@autographcraft/core';

import type {
  AutoGraphCraftConfiguration,
  MergedTypeDef,
  ScalarDetail,
} from '@autographcraft/core';
import { DEFAULT_SCALARS, PACKAGE_SCALARS } from '@autographcraft/core';
import {
  convertSchemaToDocumentTypeDef,
  convertScalarDetailToScalarFilterInput,
} from './helpers';

const PERMITTED_EXTENSIONS: string[] = ['graphql', 'gql'];

/**
 * Fetches the schema from the source directory and combines it into a single type
 * definition for processing.
 *
 * **NOTE**:
 * This function will only fetch the schema files with the extensions of .graphql or
 * .gql; all other files will be ignored.
 *
 * @param configuration The configuration object for the AutoGraphCraft project
 * @returns The complete schema merged type defs
 */
export async function fetchMergedTypeDefs(
  currentWorkingDirectory: string,
  configuration: AutoGraphCraftConfiguration,
  customScalars: ScalarDetail[]
): Promise<MergedTypeDef> {
  const schemaSourceDirectory = join(
    currentWorkingDirectory,
    configuration.schemaSourceDirectory
  );

  logger.info(`Fetching schema files from ${schemaSourceDirectory}...`);

  const typesArray: DocumentNode[] = loadFilesSync(schemaSourceDirectory, {
    extensions: PERMITTED_EXTENSIONS,
  });

  if (typesArray.length === 0) {
    throw new Error(
      `No schema files found in the directory ${schemaSourceDirectory}`
    );
  }

  // For all default scalars, add the filter input types
  DEFAULT_SCALARS.forEach((defaultScalar) => {
    const scalarTypeDef = convertScalarDetailToScalarFilterInput(defaultScalar);
    typesArray.push(scalarTypeDef);
  });

  // Add all the package scalars to the types
  PACKAGE_SCALARS.forEach((packageScalar) => {
    const packageScalarString = `scalar ${packageScalar.scalarName}`;
    const typeDef = convertSchemaToDocumentTypeDef(packageScalarString);
    typesArray.push(typeDef);
    const scalarTypeDef = convertScalarDetailToScalarFilterInput(packageScalar);
    typesArray.push(scalarTypeDef);
  });

  // Add all the custom scalars to the types
  customScalars.forEach((customScalar) => {
    const customScalarString = `scalar ${customScalar.scalarName}`;
    const typeDef = convertSchemaToDocumentTypeDef(customScalarString);
    typesArray.push(typeDef);
    const scalarTypeDef = convertScalarDetailToScalarFilterInput(customScalar);
    typesArray.push(scalarTypeDef);
  });

  const mergedTypeDefs = mergeTypeDefs(typesArray);
  const printableTypeDefs = print(mergedTypeDefs);

  logger.info(`Schema files successfully fetched and merged`);

  return {
    typeDefs: mergedTypeDefs,
    printableTypeDefs,
  };
}
