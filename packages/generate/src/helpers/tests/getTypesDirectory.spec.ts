import { describe, expect, it } from '@jest/globals';
import { join } from 'path';
import { DATABASE_CODES } from '@autographcraft/core';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import { getTypesDirectory } from '../getTypesDirectory';

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

describe('getTypesDirectory', () => {
  it('should be defined', () => {
    // Assert
    expect(getTypesDirectory).toBeDefined();
  });

  it('should join the current working directory with the configured types directory', () => {
    // Arrange
    const configuration = getConfiguration();

    // Act
    const result = getTypesDirectory('/home/user/project', configuration);

    // Assert
    expect(result).toBe(join('/home/user/project', 'src/generatedTypes'));
  });

  it('should normalise a types directory that contains relative segments', () => {
    // Arrange
    const configuration = getConfiguration({
      generatedTypesDirectory: './src/../src/types',
    });

    // Act
    const result = getTypesDirectory('/home/user/project', configuration);

    // Assert
    expect(result).toBe(join('/home/user/project', 'src', 'types'));
  });
});
