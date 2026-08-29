import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { join, sep } from 'path';
import { TYPESCRIPT_TYPES_FILE_NAME } from '@autographcraft/core';
import type { Types } from '@graphql-codegen/plugin-helpers';
import { getPackageAndCustomScalars } from '../getPackageAndCustomScalars';
import {
  GENERATED_TYPES_DIRECTORY,
  PRINTABLE_SCHEMA,
  PRINTABLE_SCHEMA_PATH,
  getConfiguration,
  getInputFiles,
} from './createTypesFileDetails.data';

type CodeGenOutputFileDetail = {
  filename: string;
  content: string;
  hooks: Record<string, unknown>;
};

// ESM has no automocking, so the code generator is replaced explicitly; no
// schema is ever compiled and nothing is written to disk.
const generate =
  jest.fn<
    (
      config: Types.Config,
      saveToFile: boolean
    ) => Promise<CodeGenOutputFileDetail[]>
  >();

jest.unstable_mockModule('@graphql-codegen/cli', () => ({ generate }));

const { createTypesFileDetails } = await import('../createTypesFileDetails');

const CURRENT_WORKING_DIRECTORY = '/home/user/project';
const EXPECTED_TYPES_FILE_PATH = join(
  CURRENT_WORKING_DIRECTORY,
  GENERATED_TYPES_DIRECTORY,
  `${TYPESCRIPT_TYPES_FILE_NAME}.ts`
);

describe('createTypesFileDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    generate.mockResolvedValue([
      {
        filename: EXPECTED_TYPES_FILE_PATH,
        content: 'export type User = { id: string };',
        hooks: {},
      },
    ]);
  });

  it('should be defined', () => {
    // Assert
    expect(createTypesFileDetails).toBeDefined();
  });

  it('should pass the printable schema and the types file path to the code generator', async () => {
    // Arrange
    const configuration = getConfiguration();
    const files = getInputFiles();

    // Act
    await createTypesFileDetails(
      CURRENT_WORKING_DIRECTORY,
      configuration,
      files
    );

    // Assert
    expect(generate).toHaveBeenCalledTimes(1);
    const [codegenConfig, saveToFile] = generate.mock.calls[0];
    expect(saveToFile).toBe(false);
    expect(codegenConfig.overwrite).toBe(true);
    expect(codegenConfig.errorsOnly).toBe(true);
    expect(codegenConfig.schema).toBe(PRINTABLE_SCHEMA);
    expect(Object.keys(codegenConfig.generates)).toEqual([
      EXPECTED_TYPES_FILE_PATH,
    ]);
    expect(codegenConfig.generates[EXPECTED_TYPES_FILE_PATH]).toEqual({
      plugins: ['typescript'],
      config: { scalars: getPackageAndCustomScalars() },
    });
  });

  it('should map every generated file into an overwritable output file detail', async () => {
    // Arrange
    generate.mockResolvedValueOnce([
      { filename: EXPECTED_TYPES_FILE_PATH, content: 'first', hooks: {} },
      { filename: '/another/file.ts', content: 'second', hooks: {} },
    ]);

    // Act
    const result = await createTypesFileDetails(
      CURRENT_WORKING_DIRECTORY,
      getConfiguration(),
      getInputFiles()
    );

    // Assert
    expect(result).toEqual([
      {
        filePath: EXPECTED_TYPES_FILE_PATH,
        content: 'first',
        addIgnoreHeader: true,
        shouldOverwrite: true,
      },
      {
        filePath: '/another/file.ts',
        content: 'second',
        addIgnoreHeader: true,
        shouldOverwrite: true,
      },
    ]);
  });

  it('should return an empty array when the code generator produces no files', async () => {
    // Arrange
    generate.mockResolvedValueOnce([]);

    // Act
    const result = await createTypesFileDetails(
      CURRENT_WORKING_DIRECTORY,
      getConfiguration(),
      getInputFiles()
    );

    // Assert
    expect(result).toEqual([]);
  });

  it('should normalise the incoming file paths onto the platform separator', async () => {
    // Arrange
    const files = getInputFiles();

    // Act
    await createTypesFileDetails(
      CURRENT_WORKING_DIRECTORY,
      getConfiguration(),
      files
    );

    // Assert
    expect(files[0].filePath).toBe(join('src', 'models', 'User', 'index.ts'));
    expect(files[1].filePath).toBe(PRINTABLE_SCHEMA_PATH);
    expect(files.every((file) => !file.filePath.startsWith(sep))).toBe(true);
  });

  it('should throw when the printable schema file is not in the supplied files', async () => {
    // Arrange
    const files = getInputFiles().slice(0, 1);

    // Act / Assert
    await expect(
      createTypesFileDetails(
        CURRENT_WORKING_DIRECTORY,
        getConfiguration(),
        files
      )
    ).rejects.toThrow(
      `Could not find the printable schema file at ${PRINTABLE_SCHEMA_PATH}`
    );
    expect(generate).not.toHaveBeenCalled();
  });

  it('should look for the printable schema in the configured types directory', async () => {
    // Arrange
    const configuration = getConfiguration({
      generatedTypesDirectory: 'a/different/directory',
    });

    // Act / Assert
    await expect(
      createTypesFileDetails(
        CURRENT_WORKING_DIRECTORY,
        configuration,
        getInputFiles()
      )
    ).rejects.toThrow(
      `Could not find the printable schema file at ${join('a/different/directory', 'typedefs.graphql')}`
    );
  });
});
