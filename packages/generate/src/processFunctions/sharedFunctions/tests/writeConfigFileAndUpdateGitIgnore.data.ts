import cloneDeep from 'lodash.clonedeep';
import {
  DEFAULT_CONFIG,
  GIT_IGNORE_LABEL,
  type AutoGraphCraftConfiguration,
} from '@autographcraft/core';

/**
 * A `.gitignore` that AutoGraphCraft has never touched.
 */
export const GIT_IGNORE_WITHOUT_LABEL = ['node_modules', 'dist', ''].join('\n');

/**
 * A `.gitignore` that AutoGraphCraft has never touched and which does not end
 * with a blank line.
 */
export const GIT_IGNORE_WITHOUT_LABEL_OR_TRAILING_BLANK = [
  'node_modules',
  'dist',
].join('\n');

/**
 * A `.gitignore` file with no content at all.
 */
export const GIT_IGNORE_EMPTY = '';

/**
 * A `.gitignore` already carrying every line the default configuration needs.
 */
export const GIT_IGNORE_FULLY_POPULATED = [
  'node_modules',
  GIT_IGNORE_LABEL,
  'autographcraft.log',
  'src/models/*/*',
  '!src/models/*/hookIns',
  'src/generatedUtils',
  'src/generatedDatabase',
  'src/generatedTypes',
].join('\n');

/**
 * A `.gitignore` carrying the lines produced by `getPreviousConfig()`, so the
 * old lines have to be replaced rather than appended to.
 */
export const GIT_IGNORE_WITH_PREVIOUS_VALUES = [
  'node_modules',
  GIT_IGNORE_LABEL,
  'src/oldTypes',
  'src/oldDatabase',
  'src/oldUtils',
  'src/oldModels/*/*',
  '!src/oldModels/*/hookIns',
  'autographcraft.log',
].join('\n');

/**
 * The same content as `GIT_IGNORE_WITH_PREVIOUS_VALUES`, but with the label
 * pushed well down the file. The index of every managed line is then offset
 * from the label index, which is what catches an index computed against the
 * wrong origin.
 */
export const GIT_IGNORE_WITH_PREVIOUS_VALUES_AND_LEADING_CONTENT = [
  'node_modules',
  'dist',
  'coverage',
  '',
  GIT_IGNORE_LABEL,
  'src/oldTypes',
  'src/oldDatabase',
  'src/oldUtils',
  'src/oldModels/*/*',
  '!src/oldModels/*/hookIns',
  'autographcraft.log',
].join('\n');

/**
 * A `.gitignore` carrying the previous values *above* the label as well as
 * below it, so an index taken from the whole file rather than from the lines
 * under the label would replace the wrong line.
 */
export const GIT_IGNORE_WITH_PREVIOUS_VALUES_ABOVE_AND_BELOW_LABEL = [
  'src/oldTypes',
  'src/oldDatabase',
  '',
  GIT_IGNORE_LABEL,
  'src/oldTypes',
  'src/oldDatabase',
  'src/oldUtils',
  'src/oldModels/*/*',
  '!src/oldModels/*/hookIns',
  'autographcraft.log',
].join('\n');

/**
 * A `.gitignore` with the label but nothing underneath it.
 */
export const GIT_IGNORE_WITH_EMPTY_LABEL = [
  'node_modules',
  GIT_IGNORE_LABEL,
].join('\n');

/**
 * A `.gitignore` with the label well down the file and nothing underneath it.
 */
export const GIT_IGNORE_WITH_EMPTY_LABEL_AND_LEADING_CONTENT = [
  'node_modules',
  'dist',
  'coverage',
  '',
  GIT_IGNORE_LABEL,
].join('\n');

const previousConfig: AutoGraphCraftConfiguration = {
  ...DEFAULT_CONFIG,
  generatedTypesDirectory: 'src/oldTypes',
  generatedDatabaseDirectory: 'src/oldDatabase',
  generatedUtilsDirectory: 'src/oldUtils',
  generatedModelsDirectory: 'src/oldModels',
};

const newConfig: AutoGraphCraftConfiguration = {
  ...DEFAULT_CONFIG,
  generatedTypesDirectory: 'src/newTypes',
  generatedDatabaseDirectory: 'src/newDatabase',
  generatedUtilsDirectory: 'src/newUtils',
  generatedModelsDirectory: 'src/newModels',
};

export function getDefaultConfig(): AutoGraphCraftConfiguration {
  return cloneDeep(DEFAULT_CONFIG);
}

export function getPreviousConfig(): AutoGraphCraftConfiguration {
  return cloneDeep(previousConfig);
}

export function getNewConfig(): AutoGraphCraftConfiguration {
  return cloneDeep(newConfig);
}
