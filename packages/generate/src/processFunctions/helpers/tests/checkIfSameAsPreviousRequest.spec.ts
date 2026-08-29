import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { join } from 'path';
import type {
  AutoGraphCraftConfiguration,
  MergedTypeDef,
} from '@autographcraft/core';
import {
  STORED_DETAILS_DIR_NAME,
  LAST_REQUEST_FILE_NAME,
  PROCESS_ARGUMENT_PARAMS,
} from '../../../constants';
import type { ProcessFunctionParams } from '../../../types';

// ESM has no automocking, so the members this unit reaches for are named
// explicitly, and the unit under test is imported after the mocks are
// registered.
const existsSync = jest.fn<(path: string) => boolean>();
const readFileSync = jest.fn<(path: string, encoding: string) => string>();

jest.unstable_mockModule('node:fs', () => ({ existsSync, readFileSync }));

const userInfo = jest.fn(() => ({ homedir: '/home/user' }));
jest.unstable_mockModule('os', () => ({
  default: { userInfo },
  userInfo,
}));

const { checkIfSameAsPreviousRequest, getLastRequestStrings } =
  await import('../checkIfSameAsPreviousRequest');

const HOMEDIR = '/home/user';
const FILEPATH = join(HOMEDIR, STORED_DETAILS_DIR_NAME, LAST_REQUEST_FILE_NAME);

const CONFIGURATION = {
  schemaSourceDirectory: 'src/schema',
} as AutoGraphCraftConfiguration;

const SCHEMA = {
  printableTypeDefs: 'type Test { id: ID }',
} as MergedTypeDef;

function getParams(
  overrides: Partial<ProcessFunctionParams> = {}
): ProcessFunctionParams {
  return { _: ['generate'], ...overrides };
}

function getStoredRequest(
  overrides: { configuration?: string; printableTypeDefs?: string } = {}
): string {
  return JSON.stringify({
    configuration: JSON.stringify(CONFIGURATION),
    printableTypeDefs: SCHEMA.printableTypeDefs,
    ...overrides,
  });
}

describe('checkIfSameAsPreviousRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(getStoredRequest());
  });

  it('should be defined', () => {
    // Assert
    expect(checkIfSameAsPreviousRequest).toBeDefined();
  });

  it('should return true when both the configuration and the schema match the stored request', () => {
    // Act
    const result = checkIfSameAsPreviousRequest(
      getParams(),
      CONFIGURATION,
      SCHEMA
    );

    // Assert
    expect(result).toBe(true);
    expect(readFileSync).toHaveBeenCalledWith(FILEPATH, 'utf-8');
  });

  it('should return false without reading the stored request when the force flag is set', () => {
    // Arrange
    const params = getParams({ [PROCESS_ARGUMENT_PARAMS.FORCE]: true });

    // Act
    const result = checkIfSameAsPreviousRequest(params, CONFIGURATION, SCHEMA);

    // Assert
    expect(result).toBe(false);
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it('should return false without reading the stored request when the short force flag is set', () => {
    // Arrange
    const params = getParams({ [PROCESS_ARGUMENT_PARAMS.FORCE_SHORT]: true });

    // Act
    const result = checkIfSameAsPreviousRequest(params, CONFIGURATION, SCHEMA);

    // Assert
    expect(result).toBe(false);
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it('should return false when there is no stored request', () => {
    // Arrange
    existsSync.mockReturnValue(false);

    // Act
    const result = checkIfSameAsPreviousRequest(
      getParams(),
      CONFIGURATION,
      SCHEMA
    );

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when the configuration has changed', () => {
    // Arrange
    readFileSync.mockReturnValue(
      getStoredRequest({
        configuration: JSON.stringify({ schemaSourceDirectory: 'other' }),
      })
    );

    // Act
    const result = checkIfSameAsPreviousRequest(
      getParams(),
      CONFIGURATION,
      SCHEMA
    );

    // Assert
    expect(result).toBe(false);
  });

  it('should return false when the schema has changed', () => {
    // Arrange
    readFileSync.mockReturnValue(
      getStoredRequest({ printableTypeDefs: 'type Other { id: ID }' })
    );

    // Act
    const result = checkIfSameAsPreviousRequest(
      getParams(),
      CONFIGURATION,
      SCHEMA
    );

    // Assert
    expect(result).toBe(false);
  });
});

describe('getLastRequestStrings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(getStoredRequest());
  });

  it('should read the stored request from the user home directory', () => {
    // Act
    const result = getLastRequestStrings();

    // Assert
    expect(existsSync).toHaveBeenCalledWith(FILEPATH);
    expect(result).toEqual({
      configuration: JSON.stringify(CONFIGURATION),
      printableTypeDefs: SCHEMA.printableTypeDefs,
    });
  });

  it('should return null when the stored request file does not exist', () => {
    // Arrange
    existsSync.mockReturnValue(false);

    // Act
    const result = getLastRequestStrings();

    // Assert
    expect(result).toBeNull();
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it('should return null when the stored request is not valid JSON', () => {
    // Arrange
    readFileSync.mockReturnValue('not json');

    // Act
    const result = getLastRequestStrings();

    // Assert
    expect(result).toBeNull();
  });

  it('should return null when reading the stored request throws', () => {
    // Arrange
    readFileSync.mockImplementation(() => {
      throw new Error('EACCES');
    });

    // Act
    const result = getLastRequestStrings();

    // Assert
    expect(result).toBeNull();
  });
});
