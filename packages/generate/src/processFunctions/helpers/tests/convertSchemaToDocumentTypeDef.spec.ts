import { describe, expect, it } from '@jest/globals';
import { Kind } from 'graphql';
import { convertSchemaToDocumentTypeDef } from '../convertSchemaToDocumentTypeDef';

describe('convertSchemaToDocumentTypeDef', () => {
  it('should be defined', () => {
    // Assert
    expect(convertSchemaToDocumentTypeDef).toBeDefined();
  });

  it('should convert a schema string into a graphql document node', () => {
    // Act
    const result = convertSchemaToDocumentTypeDef('type Test { id: ID }');

    // Assert
    expect(result.kind).toBe(Kind.DOCUMENT);
    expect(result.definitions).toHaveLength(1);
    expect(result.definitions[0].kind).toBe(Kind.OBJECT_TYPE_DEFINITION);
  });

  it('should convert a scalar definition into a graphql document node', () => {
    // Act
    const result = convertSchemaToDocumentTypeDef('scalar AWSDateTime');

    // Assert
    expect(result.definitions[0].kind).toBe(Kind.SCALAR_TYPE_DEFINITION);
  });

  it('should throw when the schema string is not valid graphql', () => {
    // Act / Assert
    expect(() => convertSchemaToDocumentTypeDef('type Test {')).toThrow();
  });
});
