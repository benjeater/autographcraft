import {
  jest,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { join } from 'path';
import { parse, print, type DocumentNode } from 'graphql';
import type {
  AutoGraphCraftConfiguration,
  ScalarDetail,
} from '@autographcraft/core';
import { PossibleFilters } from '@autographcraft/core';

// ESM mock factories must provide every export the module graph reaches for -
// a missing one is a SyntaxError, not `undefined` - so spread the real module
// and override only the logger this suite asserts against. `logger.end` is a
// winston method the empty-schema path calls before exiting.
const actualCore = jest.requireActual<typeof import('@autographcraft/core')>(
  '@autographcraft/core'
);

jest.unstable_mockModule('@autographcraft/core', () => ({
  ...actualCore,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    end: jest.fn(),
  },
}));

// `../helpers` re-exports `validateSchema`, which pulls in @graphql-codegen/cli;
// codegen 7 depends on yargs 18 and chalk 5, neither of which Jest's ESM loader
// can link. Stubbing it lets the real scalar conversion helpers be used here.
jest.unstable_mockModule('@graphql-codegen/cli', () => ({
  generate: jest.fn(),
}));

const loadFilesSync =
  jest.fn<(dir: string, options: { extensions: string[] }) => DocumentNode[]>();
jest.unstable_mockModule('@graphql-tools/load-files', () => ({
  loadFilesSync,
}));

const mergeTypeDefs = jest.fn<(typeDefs: DocumentNode[]) => DocumentNode>();
jest.unstable_mockModule('@graphql-tools/merge', () => ({ mergeTypeDefs }));

const { logger } = await import('@autographcraft/core');
const { fetchMergedTypeDefs } = await import('../fetchMergedTypeDefs');

const { DEFAULT_SCALARS, PACKAGE_SCALARS } = actualCore;

const CWD = '/current/working/directory';
const CONFIGURATION = {
  schemaSourceDirectory: 'src/schema',
} as AutoGraphCraftConfiguration;
const SCHEMA_DIRECTORY = join(CWD, 'src/schema');

const MERGED_DOCUMENT = parse('type Query {\n  hello: String\n}');

function getSchemaFileDocuments(): DocumentNode[] {
  return [parse('type User @model { id: ID! }')];
}

function getCustomScalar(scalarName: string): ScalarDetail {
  return {
    scalarName,
    javascriptType: 'string',
    filtersAvailable: [PossibleFilters.eq, PossibleFilters.in],
  };
}

describe('fetchMergedTypeDefs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadFilesSync.mockReturnValue(getSchemaFileDocuments());
    mergeTypeDefs.mockReturnValue(MERGED_DOCUMENT);
    // `process.exit` is stubbed to throw so the empty-schema path can be
    // asserted on without the rest of the function running.
    jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    // Assert
    expect(fetchMergedTypeDefs).toBeDefined();
  });

  it('should load only .graphql and .gql files from the configured schema directory', async () => {
    // Act
    await fetchMergedTypeDefs(CWD, CONFIGURATION, []);

    // Assert
    expect(loadFilesSync).toHaveBeenCalledWith(SCHEMA_DIRECTORY, {
      extensions: ['graphql', 'gql'],
    });
  });

  it('should return the merged type defs and their printable form', async () => {
    // Act
    const result = await fetchMergedTypeDefs(CWD, CONFIGURATION, []);

    // Assert
    expect(result.typeDefs).toBe(MERGED_DOCUMENT);
    expect(result.printableTypeDefs).toBe(print(MERGED_DOCUMENT));
  });

  it('should warn, close the logger and exit when no schema files are found', async () => {
    // Arrange
    loadFilesSync.mockReturnValue([]);

    // Act / Assert
    await expect(fetchMergedTypeDefs(CWD, CONFIGURATION, [])).rejects.toThrow(
      'process.exit called'
    );
    expect(logger.warn).toHaveBeenCalledWith(
      `No schema files found in the directory ${SCHEMA_DIRECTORY}`
    );
    expect(logger.end).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(0);
    expect(mergeTypeDefs).not.toHaveBeenCalled();
  });

  it('should append a filter input for every default scalar', async () => {
    // Act
    await fetchMergedTypeDefs(CWD, CONFIGURATION, []);

    // Assert
    const [mergedInput] = mergeTypeDefs.mock.calls[0];
    const printed = mergedInput.map((typeDef) => print(typeDef));
    DEFAULT_SCALARS.forEach((scalar) => {
      expect(printed).toContainEqual(
        expect.stringContaining(`input ${scalar.scalarName}Input {`)
      );
    });
  });

  it('should append both a scalar declaration and a filter input for every package scalar', async () => {
    // Act
    await fetchMergedTypeDefs(CWD, CONFIGURATION, []);

    // Assert
    const [mergedInput] = mergeTypeDefs.mock.calls[0];
    const printed = mergedInput.map((typeDef) => print(typeDef));
    PACKAGE_SCALARS.forEach((scalar) => {
      expect(printed).toContain(`scalar ${scalar.scalarName}`);
      expect(printed).toContainEqual(
        expect.stringContaining(`input ${scalar.scalarName}Input {`)
      );
    });
  });

  it('should append both a scalar declaration and a filter input for every custom scalar', async () => {
    // Arrange
    const customScalars = [getCustomScalar('Money'), getCustomScalar('Colour')];

    // Act
    await fetchMergedTypeDefs(CWD, CONFIGURATION, customScalars);

    // Assert
    const [mergedInput] = mergeTypeDefs.mock.calls[0];
    const printed = mergedInput.map((typeDef) => print(typeDef));
    expect(printed).toContain('scalar Money');
    expect(printed).toContain('scalar Colour');
    expect(printed).toContainEqual(
      expect.stringContaining('input MoneyInput {')
    );
    expect(printed).toContainEqual(
      expect.stringContaining('input ColourInput {')
    );
  });

  it('should merge the schema files together with every scalar type def', async () => {
    // Arrange
    const schemaFiles = getSchemaFileDocuments();
    loadFilesSync.mockReturnValue(schemaFiles);
    const customScalars = [getCustomScalar('Money')];

    // Act
    await fetchMergedTypeDefs(CWD, CONFIGURATION, customScalars);

    // Assert
    const [mergedInput] = mergeTypeDefs.mock.calls[0];
    expect(mergedInput).toHaveLength(
      schemaFiles.length +
        DEFAULT_SCALARS.length +
        PACKAGE_SCALARS.length * 2 +
        customScalars.length * 2
    );
    expect(mergedInput[0]).toBe(schemaFiles[0]);
  });

  it('should not modify the array returned by loadFilesSync', async () => {
    // Arrange
    const schemaFiles = getSchemaFileDocuments();
    loadFilesSync.mockReturnValue(schemaFiles);

    // Act
    await fetchMergedTypeDefs(CWD, CONFIGURATION, [getCustomScalar('Money')]);

    // Assert
    expect(schemaFiles.map((typeDef) => print(typeDef))).toEqual(
      getSchemaFileDocuments().map((typeDef) => print(typeDef))
    );
    expect(schemaFiles).toHaveLength(1);
    const [mergedInput] = mergeTypeDefs.mock.calls[0];
    expect(mergedInput).not.toBe(schemaFiles);
  });

  it('should report progress before and after the merge', async () => {
    // Act
    await fetchMergedTypeDefs(CWD, CONFIGURATION, []);

    // Assert
    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      `Fetching schema files from ${SCHEMA_DIRECTORY}...`
    );
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      'Schema files successfully fetched and merged'
    );
  });
});
