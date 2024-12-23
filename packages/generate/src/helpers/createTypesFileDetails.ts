import { join } from 'path';
import { generate } from '@graphql-codegen/cli';
import type { Types } from '@graphql-codegen/plugin-helpers';
import type { AutoGraphCraftApiResponse } from '../types';
import type {
  AutoGraphCraftConfiguration,
  OutputFileDetail,
  ScalarDetail,
} from '@autographcraft/core';
import { PACKAGE_SCALARS, TYPE_DEFS_FILE_NAME } from '@autographcraft/core';
import { getTypescriptTypesFilePath } from './getTypescriptTypesFilePath';

type CodeGenOutputFileDetail = {
  filename: string;
  content: string;
  hooks: Record<string, unknown>;
};

export async function createTypesFileDetails(
  currentWorkingDirectory: string,
  configuration: AutoGraphCraftConfiguration,
  apiResponse: AutoGraphCraftApiResponse
): Promise<OutputFileDetail[]> {
  const printableSchemaFileContent = getPrintableSchemaFileContent(
    configuration,
    apiResponse
  );

  const outputFiles: OutputFileDetail[] = [];

  // Generate types library
  const generateCodeGenConfig: Types.Config = {
    overwrite: true,
    schema: printableSchemaFileContent,
    silent: true,
    generates: {
      [getTypescriptTypesFilePath(currentWorkingDirectory, configuration)]: {
        plugins: ['typescript'],
        config: {
          scalars: getPackageAndCustomScalars(),
        },
      },
    },
  };
  const codegenOutputFileDetails: CodeGenOutputFileDetail[] = await generate(
    generateCodeGenConfig,
    false
  );
  // For each of the generated files, add it to the outputFiles
  for (const generatedFile of codegenOutputFileDetails) {
    outputFiles.push({
      filePath: generatedFile.filename,
      content: generatedFile.content,
      addIgnoreHeader: true,
      shouldOverwrite: true,
    });
  }

  return outputFiles;
}

/**
 * Extracts the content of the printable schema file from the API response
 * @param currentWorkingDirectory The current working directory
 * @param configuration The configuration object for AutoGraphCraft
 * @param apiResponse The API response from AutoGraphCraft
 * @returns
 */
function getPrintableSchemaFileContent(
  configuration: AutoGraphCraftConfiguration,
  apiResponse: AutoGraphCraftApiResponse
): string {
  const printableSchemaFilePath = join(
    configuration.generatedTypesDirectory,
    TYPE_DEFS_FILE_NAME
  );

  // Remove leading slash from all file paths
  const files = apiResponse.files.map((file) => {
    file.filePath = file.filePath.replace(/^\//, '');
    return file;
  });

  const printableSchemaFile = files.find(
    (file) => file.filePath === printableSchemaFilePath
  );
  if (!printableSchemaFile) {
    throw new Error(
      `Could not find the printable schema file at ${printableSchemaFilePath}`
    );
  }

  return printableSchemaFile.content;
}

function getPackageAndCustomScalars(): Record<string, string> {
  const scalarsToMap: ScalarDetail[] = [
    ...PACKAGE_SCALARS,
    // ...customScalars, // TODO: custom scalars
  ];

  const scalars: Record<string, string> = scalarsToMap.reduce(
    (acc, scalar) => {
      acc[scalar.scalarName] = scalar.javascriptType;
      return acc;
    },
    {} as Record<string, string>
  );
  return scalars;
}
