import { describe, expect, it } from '@jest/globals';
import { join } from 'path';
import {
  DATABASE_CODES,
  TYPESCRIPT_TYPES_FILE_NAME,
} from '@autographcraft/core';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import { getTypescriptTypesFilePath } from '../getTypescriptTypesFilePath';

function getConfiguration(
  overrides: Partial<AutoGraphCraftConfiguration> = {}
): AutoGraphCraftConfiguration {
  return {
    generatedTypesDirectory: 'src/generatedTypes',
    generatedDatabaseDirectory: 'src/generatedDatabase',
    generatedUtilsDirectory: 'src/generatedUtils',
    generatedModelsDirectory: 'src/models',
    queriesDirectory: 'src/generatedQueries',
    mutationsDirectory: 'src/generatedMutations',
    schemaSourceDirectory: 'src/schemas',
    gitIgnorePath: '.gitignore',
    databaseType: DATABASE_CODES.MONGO_DB,
    authorisationStructure: [],
    ...overrides,
  };
}

describe('getTypescriptTypesFilePath', () => {
  it('should be defined', () => {
    // Assert
    expect(getTypescriptTypesFilePath).toBeDefined();
  });

  it('should return the path of the typescript types file inside the types directory', () => {
    // Arrange
    const configuration = getConfiguration();

    // Act
    const result = getTypescriptTypesFilePath(
      '/home/user/project',
      configuration
    );

    // Assert
    expect(result).toBe(
      join(
        '/home/user/project',
        'src/generatedTypes',
        `${TYPESCRIPT_TYPES_FILE_NAME}.ts`
      )
    );
    expect(result.endsWith('.ts')).toBe(true);
  });

  it('should use the configured types directory', () => {
    // Arrange
    const configuration = getConfiguration({
      generatedTypesDirectory: 'other/types',
    });

    // Act
    const result = getTypescriptTypesFilePath('/root', configuration);

    // Assert
    expect(result).toBe(
      join('/root', 'other/types', `${TYPESCRIPT_TYPES_FILE_NAME}.ts`)
    );
  });
});
