import { describe, expect, it } from '@jest/globals';
import { parse } from 'graphql';
import { getFileGenerationQuery } from '../getFileGenerationQuery';

describe('getFileGenerationQuery', () => {
  it('should be defined', () => {
    // Assert
    expect(getFileGenerationQuery).toBeDefined();
  });

  it('should return a parseable GraphQL query document', () => {
    // Act
    const query = getFileGenerationQuery();

    // Assert
    expect(() => parse(query)).not.toThrow();
  });

  it('should declare the configuration and schema variables as required strings', () => {
    // Act
    const query = getFileGenerationQuery();

    // Assert
    expect(query).toContain('$configuration: String!');
    expect(query).toContain('$schema: String!');
    expect(query).toContain(
      'generate(configuration: $configuration, schema: $schema)'
    );
  });

  it('should request the signedUrl, warnings and executionDurationMs fields', () => {
    // Act
    const query = getFileGenerationQuery();

    // Assert
    expect(query).toContain('signedUrl');
    expect(query).toContain('warnings');
    expect(query).toContain('executionDurationMs');
  });
});
