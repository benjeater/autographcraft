import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { join } from 'path';
import type {
  AutoGraphCraftConfiguration,
  MergedTypeDef,
} from '@autographcraft/core';
import {
  STORED_DETAILS_DIR_NAME,
  LAST_REQUEST_FILE_NAME,
} from '../../../constants';

// ESM has no automocking, so the members this unit reaches for are named
// explicitly, and the unit under test is imported after the mocks are
// registered.
const writeFileSync = jest.fn<(path: string, contents: string) => void>();

jest.unstable_mockModule('node:fs', () => ({ writeFileSync }));

const userInfo = jest.fn(() => ({ homedir: '/home/user' }));
jest.unstable_mockModule('os', () => ({
  default: { userInfo },
  userInfo,
}));

const { savePreviousRequest } = await import('../savePreviousRequest');

const HOMEDIR = '/home/user';
const FILEPATH = join(HOMEDIR, STORED_DETAILS_DIR_NAME, LAST_REQUEST_FILE_NAME);

function getConfiguration(): AutoGraphCraftConfiguration {
  return {
    schemaSourceDirectory: 'src/schema',
  } as AutoGraphCraftConfiguration;
}

function getSchema(): MergedTypeDef {
  return {
    printableTypeDefs: 'type Test { id: ID }',
  } as MergedTypeDef;
}

describe('savePreviousRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    // Assert
    expect(savePreviousRequest).toBeDefined();
  });

  it('should write the stringified configuration and printable type defs to the last request file', () => {
    // Arrange
    const configuration = getConfiguration();
    const schema = getSchema();

    // Act
    savePreviousRequest(configuration, schema);

    // Assert
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const [actualPath, actualContents] = writeFileSync.mock.calls[0];
    expect(actualPath).toBe(FILEPATH);
    expect(JSON.parse(actualContents)).toEqual({
      configuration: JSON.stringify(configuration),
      printableTypeDefs: schema.printableTypeDefs,
    });
  });

  it('should swallow a write error and report it on the console', () => {
    // Arrange
    writeFileSync.mockImplementationOnce(() => {
      throw new Error('EACCES');
    });

    // Act
    const act = () => savePreviousRequest(getConfiguration(), getSchema());

    // Assert
    expect(act).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'Error saving previous request: Error: EACCES'
    );
  });
});
