import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'path';
import os from 'os';
import { STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME } from '../../constants';
import { getExistingAuthTokens } from '../getExistingAuthTokens';

jest.mock('node:fs');
jest.mock('os');

(os.userInfo as jest.Mock).mockReturnValue({ homedir: '/home/user' });

const homedir = '/home/user';
const filepath = join(homedir, STORED_DETAILS_DIR_NAME, TOKEN_FILE_NAME);
const authTokens = `{ "idToken": "testIdToken", "accessToken": "testAccessToken", "refreshToken": "testRefreshToken" }`;

describe('getExistingAuthTokens', () => {
  beforeEach(() => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(authTokens);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    // Assert
    expect(getExistingAuthTokens).toBeDefined();
  });

  it('should return null if the file does not exist', () => {
    // Arrange
    (existsSync as jest.Mock).mockReturnValueOnce(false);

    // Act
    const result = getExistingAuthTokens();
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
  });

  it('should return null if the file is empty', () => {
    // Arrange
    (readFileSync as jest.Mock).mockReturnValueOnce('');

    // Act
    const result = getExistingAuthTokens();

    // Assert
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
    expect(readFileSync).toHaveBeenCalledWith(filepath, 'utf-8');
  });

  it('should return null if the file is not valid JSON', () => {
    // Arrange
    (readFileSync as jest.Mock).mockReturnValueOnce('not json');

    // Act
    const result = getExistingAuthTokens();

    // Assert
    expect(result).toBeNull();
    expect(existsSync).toHaveBeenCalledWith(filepath);
    expect(readFileSync).toHaveBeenCalledWith(filepath, 'utf-8');
  });

  it('should return null if there is an error', () => {
    // Arrange
    (readFileSync as jest.Mock).mockImplementationOnce(() => {
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
