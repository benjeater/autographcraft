import cloneDeep from 'lodash.clonedeep';
import { parse } from 'graphql';
import type { OutputFileDetail } from '@autographcraft/core';
import type { AutoGraphCraftApiResponse } from '../../types';
// `MergedTypeDef` is not re-exported from `../../types`, so it comes straight
// from the module that declares it.
import type { MergedTypeDef } from '../../types/MergedTypeDefs';

const PRINTABLE_TYPE_DEFS = `type User {
  id: ID!
  name: String!
}`;

const generatedFiles: OutputFileDetail[] = [
  {
    filePath: 'src/models/User/resolvers/create.ts',
    content: 'export const create = () => {};',
    addIgnoreHeader: true,
    shouldOverwrite: true,
  },
  {
    filePath: 'src/models/User/resolvers/read.ts',
    content: 'export const read = () => {};',
    addIgnoreHeader: true,
    shouldOverwrite: true,
  },
];

const typesFiles: OutputFileDetail[] = [
  {
    filePath: 'src/generatedTypes/typescriptTypes.ts',
    content: 'export type User = { id: string; name: string };',
    addIgnoreHeader: true,
    shouldOverwrite: true,
  },
];

const apiResponse: AutoGraphCraftApiResponse = {
  signedUrl: 'https://example.com/signed-url',
  executionDurationMs: 1234,
  warnings: [],
};

export function getSchema(): MergedTypeDef {
  return {
    typeDefs: parse(PRINTABLE_TYPE_DEFS),
    printableTypeDefs: PRINTABLE_TYPE_DEFS,
  };
}

export function getGeneratedFiles(): OutputFileDetail[] {
  return cloneDeep(generatedFiles);
}

export function getTypesFiles(): OutputFileDetail[] {
  return cloneDeep(typesFiles);
}

export function getApiResponse(): AutoGraphCraftApiResponse {
  return cloneDeep(apiResponse);
}
