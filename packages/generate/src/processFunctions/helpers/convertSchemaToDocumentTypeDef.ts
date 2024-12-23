import { DocumentNode, parse } from 'graphql';

export function convertSchemaToDocumentTypeDef(schema: string): DocumentNode {
  return parse(schema);
}
