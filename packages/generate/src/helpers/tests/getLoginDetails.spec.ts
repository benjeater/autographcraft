import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { join } from 'path';
import { STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME } from '../../constants';

// ESM has no automocking, so the members this unit reaches for are named
// explicitly, and the unit under test is imported after the mocks are
// registered.
const existsSync = jest.fn<(path: string) => boolean>();
const readFileSync = jest.fn<(path: string, encoding: string) => string>();

jest.unstable_mockModule('node:fs', () => ({ existsSync, readFileSync }));

jest.unstable_mockModule('os', () => ({
  default: { userInfo: jest.fn(() => ({ homedir: '/home/user' })) },
  userInfo: jest.fn(() => ({ homedir: '/home/user' })),
}));

const { getExistingAuthTokens } = await import('../getExistingAuthTokens');

const homedir = '/home/user';
const filepath = join(homedir, STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME);
const authTokens = `{ "idToken": "testIdToken", "accessToken": "testAccessToken", "refreshToken": "testRefreshToken" }`;

describe('getExistingAuthTokens', () => {
  beforeEach(() => {
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(authTokens);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    // Assert
    expect(getExistingAuthTokens).toBeDefined();
  });

  it('should return null if the file does not exist', () => {
    // Arrange
    existsSync.mockReturnValueOnce(false);

    // Act
    const result = getExistingAuthTokens();
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
  });

  it('should return null if the file is empty', () => {
    // Arrange
    readFileSync.mockReturnValueOnce('');

    // Act
    const result = getExistingAuthTokens();

    // Assert
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
    expect(readFileSync).toHaveBeenCalledWith(filepath, 'utf-8');
  });

  it('should return null if the file is not valid JSON', () => {
    // Arrange
    readFileSync.mockReturnValueOnce('not json');

    // Act
    const result = getExistingAuthTokens();

    // Assert
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
    expect(readFileSync).toHaveBeenCalledWith(filepath, 'utf-8');
  });

  it('should return null if there is an error', () => {
    // Arrange
    readFileSync.mockImplementationOnce(() => {
      throw new Error('error');
    });

    // Act
    const result = getExistingAuthTokens();

    // Assert
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
    expect(readFileSync).toHaveBeenCalledWith(filepath, 'utf-8');
  });

  it('should return the auth tokens', () => {
    // Act
    const result = getExistingAuthTokens();

    // Assert
    expect(result).toEqual(JSON.parse(authTokens));
    expect(existsSync).toHaveBeenCalledWith(filepath);
    expect(readFileSync).toHaveBeenCalledWith(filepath, 'utf-8');
  });
});
