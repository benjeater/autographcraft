import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { join } from 'path';
import { STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME } from '../../constants';
import type { AuthTokens } from '../../types';

// ESM has no automocking, so the members this unit reaches for are named
// explicitly, and the unit under test is imported after the mocks are
// registered. Nothing is written to the real file system.
const existsSync = jest.fn<(path: string) => boolean>();
const mkdirSync =
  jest.fn<(path: string, options: { recursive: boolean }) => void>();
const writeFileSync = jest.fn<(path: string, contents: string) => void>();

jest.unstable_mockModule('node:fs', () => ({
  existsSync,
  mkdirSync,
  writeFileSync,
}));

jest.unstable_mockModule('os', () => ({
  default: { userInfo: jest.fn(() => ({ homedir: '/home/user' })) },
  userInfo: jest.fn(() => ({ homedir: '/home/user' })),
}));

const { writeAuthTokens } = await import('../writeAuthTokens');

const homedir = '/home/user';
const storedDetailsDir = join(homedir, STORED_DETAILS_DIR_NAME);
const filepath = join(storedDetailsDir, TOKEN_FILE_NAME);

const authTokens: AuthTokens = {
  idToken: 'testIdToken',
  accessToken: 'testAccessToken',
  refreshToken: 'testRefreshToken',
};

describe('writeAuthTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    existsSync.mockReturnValue(true);
  });

  it('should be defined', () => {
    // Assert
    expect(writeAuthTokens).toBeDefined();
  });

  it('should write the tokens to the token file without creating the directory when it exists', () => {
    // Act
    writeAuthTokens(authTokens);

    // Assert
    expect(existsSync).toHaveBeenCalledWith(storedDetailsDir);
    expect(mkdirSync).not.toHaveBeenCalled();
    expect(writeFileSync).toHaveBeenCalledWith(
      filepath,
      JSON.stringify(authTokens, null, 2)
    );
  });

  it('should create the stored details directory when it does not exist', () => {
    // Arrange
    existsSync.mockReturnValueOnce(false);

    // Act
    writeAuthTokens(authTokens);

    // Assert
    expect(mkdirSync).toHaveBeenCalledWith(storedDetailsDir, {
      recursive: true,
    });
    expect(writeFileSync).toHaveBeenCalledWith(
      filepath,
      JSON.stringify(authTokens, null, 2)
    );
  });

  it('should throw a wrapped error when writing the file fails', () => {
    // Arrange
    const cause = new Error('disk full');
    writeFileSync.mockImplementationOnce(() => {
      throw cause;
    });

    // Act
    let thrown: unknown;
    try {
      writeAuthTokens(authTokens);
    } catch (e) {
      thrown = e;
    }

    // Assert
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toBe(
      'Error writing auth tokens: Error: disk full'
    );
    expect((thrown as Error).cause).toBe(cause);
  });

  it('should throw a wrapped error when creating the directory fails', () => {
    // Arrange
    existsSync.mockReturnValueOnce(false);
    const cause = new Error('permission denied');
    mkdirSync.mockImplementationOnce(() => {
      throw cause;
    });

    // Act
    let thrown: unknown;
    try {
      writeAuthTokens(authTokens);
    } catch (e) {
      thrown = e;
    }

    // Assert
    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).cause).toBe(cause);
    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
