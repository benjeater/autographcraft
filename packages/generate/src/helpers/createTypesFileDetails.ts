import { join, sep } from 'path';
import { generate } from '@graphql-codegen/cli';
import type { Types } from '@graphql-codegen/plugin-helpers';
import type {
  AutoGraphCraftConfiguration,
  OutputFileDetail,
} from '@autographcraft/core';
import { TYPE_DEFS_FILE_NAME } from '@autographcraft/core';
import { getTypescriptTypesFilePath } from './getTypescriptTypesFilePath';
import { getPackageAndCustomScalars } from './getPackageAndCustomScalars';

type CodeGenOutputFileDetail = {
  filename: string;
  content: string;
  hooks: Record<string, unknown>;
};

export async function createTypesFileDetails(
  currentWorkingDirectory: string,
  configuration: AutoGraphCraftConfiguration,
  files: OutputFileDetail[]
): Promise<OutputFileDetail[]> {
  const printableSchemaFileContent = getPrintableSchemaFileContent(
    configuration,
    files
  );

  const outputFiles: OutputFileDetail[] = [];

  // Generate types library
  const generateCodeGenConfig: Types.Config = {
    overwrite: true,
    schema: printableSchemaFileContent,
    // silent: true,
    errorsOnly: true,
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
  files: OutputFileDetail[]
): string {
  const printableSchemaFilePath = join(
    configuration.generatedTypesDirectory,
    TYPE_DEFS_FILE_NAME
  );

  // Remove leading slash from all file paths and replace all forward slashes
  // with the system's path separator
  const mappedFiles = files.map((file) => {
    file.filePath = file.filePath.replace(/^\//, '').replaceAll('/', sep);
    return file;
  });

  const printableSchemaFile = mappedFiles.find(
    (file) => file.filePath === printableSchemaFilePath
  );
  if (!printableSchemaFile) {
    throw new Error(
      `Could not find the printable schema file at ${printableSchemaFilePath}`
    );
  }

  return printableSchemaFile.content;
}
