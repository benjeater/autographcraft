import { DocumentNode } from 'graphql';

export type MergedTypeDef = {
  typeDefs: DocumentNode;
  printableTypeDefs: string;
};
