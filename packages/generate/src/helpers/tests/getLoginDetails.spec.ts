import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { join } from 'path';
import { STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME } from '../../constants';

// ESM has no automocking, so the members this unit reaches for are named
// explicitly, and the unit under test is imported after the mocks are
// registered.
jest.unstable_mockModule('node:fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.unstable_mockModule('os', () => ({
  default: { userInfo: jest.fn(() => ({ homedir: '/home/user' })) },
  userInfo: jest.fn(() => ({ homedir: '/home/user' })),
}));

const { existsSync, readFileSync } = await import('node:fs');
const { getExistingAuthTokens } = await import('../getExistingAuthTokens');

const homedir = '/home/user';
const filepath = join(homedir, STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME);
const authTokens = `{ "idToken": "testIdToken", "accessToken": "testAccessToken", "refreshToken": "testRefreshToken" }`;

describe('getExistingAuthTokens', () => {
  beforeEach(() => {
    (existsSync as jest.Mock<any>).mockReturnValue(true);
    (readFileSync as jest.Mock<any>).mockReturnValue(authTokens);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    // Assert
    expect(getExistingAuthTokens).toBeDefined();
  });

  it('should return null if the file does not exist', () => {
    // Arrange
    (existsSync as jest.Mock<any>).mockReturnValueOnce(false);

    // Act
    const result = getExistingAuthTokens();
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
  });

  it('should return null if the file is empty', () => {
    // Arrange
    (readFileSync as jest.Mock<any>).mockReturnValueOnce('');

    // Act
    const result = getExistingAuthTokens();

    // Assert
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
    expect(readFileSync).toHaveBeenCalledWith(filepath, 'utf-8');
  });

  it('should return null if the file is not valid JSON', () => {
    // Arrange
    (readFileSync as jest.Mock<any>).mockReturnValueOnce('not json');

    // Act
    const result = getExistingAuthTokens();

    // Assert
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
    expect(readFileSync).toHaveBeenCalledWith(filepath, 'utf-8');
  });

  it('should return null if there is an error', () => {
    // Arrange
    (readFileSync as jest.Mock<any>).mockImplementationOnce(() => {
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
