import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import type { JwtPayload } from 'jwt-decode';
import { SIGN_IN_URL } from '../../../constants';
import type { AuthTokens } from '../../../types';

// ESM mock factories must provide every export the module graph reaches for -
// a missing one is a SyntaxError, not `undefined` - so spread the real module
// and override only the logger this suite asserts against.
const actualCore = jest.requireActual<typeof import('@autographcraft/core')>(
  '@autographcraft/core'
);

jest.unstable_mockModule('@autographcraft/core', () => ({
  ...actualCore,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ESM has no automocking, so every member the unit reaches for is named
// explicitly and the unit is imported after the mocks are registered.
const getExistingAuthTokens = jest.fn<() => AuthTokens | null>();
const writeAuthTokens = jest.fn<(authTokens: AuthTokens) => void>();
const startRedirectServer =
  jest.fn<
    (
      freePort: number,
      uniqueRef: string,
      onTokenReceived: (authTokens: AuthTokens) => void
    ) => Promise<void>
  >();

jest.unstable_mockModule('../../../helpers', () => ({
  getExistingAuthTokens,
  writeAuthTokens,
  startRedirectServer,
}));

const open = jest.fn<(url: string) => void>();
jest.unstable_mockModule('open', () => ({ default: open }));

const getPortPromise = jest.fn<() => Promise<number>>();
jest.unstable_mockModule('portfinder', () => ({
  default: { getPortPromise },
  getPortPromise,
}));

const v4 = jest.fn<() => string>();
jest.unstable_mockModule('uuid', () => ({ v4 }));

const jwtDecode = jest.fn<(token: string) => JwtPayload>();
jest.unstable_mockModule('jwt-decode', () => ({ jwtDecode }));

const { logger } = await import('@autographcraft/core');
const { getAuthIdToken } = await import('../getAuthIdToken');

const FREE_PORT = 4321;
const UNIQUE_REF = 'aaaabbbbccccdddd';

const NEW_TOKENS: AuthTokens = {
  idToken: 'new-id-token',
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
};

function getStoredTokens(overrides: Partial<AuthTokens> = {}): AuthTokens {
  return {
    idToken: 'stored-id-token',
    accessToken: 'stored-access-token',
    refreshToken: 'stored-refresh-token',
    ...overrides,
  };
}

/** An expiry comfortably in the future, in seconds since the epoch. */
function getFutureExpiry(): number {
  return Math.floor(Date.now() / 1000) + 60 * 60;
}

/** An expiry comfortably in the past, in seconds since the epoch. */
function getPastExpiry(): number {
  return Math.floor(Date.now() / 1000) - 60 * 60;
}

describe('getAuthIdToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getExistingAuthTokens.mockReturnValue(getStoredTokens());
    jwtDecode.mockReturnValue({ exp: getFutureExpiry() });
    getPortPromise.mockResolvedValue(FREE_PORT);
    v4.mockReturnValue('aaaa-bbbb-cccc-dddd');
    startRedirectServer.mockImplementation(
      async (_freePort, _uniqueRef, onTokenReceived) => {
        onTokenReceived(NEW_TOKENS);
      }
    );
  });

  it('should be defined', () => {
    // Assert
    expect(getAuthIdToken).toBeDefined();
  });

  it('should return the stored ID token when it has not expired', async () => {
    // Act
    const result = await getAuthIdToken();

    // Assert
    expect(result).toBe('stored-id-token');
    expect(open).not.toHaveBeenCalled();
    expect(startRedirectServer).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Using existing ID token...');
  });

  it('should decode the stored ID token to check its expiry', async () => {
    // Act
    await getAuthIdToken();

    // Assert
    expect(jwtDecode).toHaveBeenCalledWith('stored-id-token');
  });

  it('should open the sign in page when there are no stored tokens', async () => {
    // Arrange
    getExistingAuthTokens.mockReturnValue(null);

    // Act
    const result = await getAuthIdToken();

    // Assert
    expect(result).toBe('new-id-token');
    expect(logger.info).toHaveBeenCalledWith('No existing session found...');
    expect(jwtDecode).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith(
      `${SIGN_IN_URL}?callback_port=${FREE_PORT}&unique_ref=${UNIQUE_REF}`
    );
  });

  it('should open the sign in page when the stored tokens have no ID token', async () => {
    // Arrange
    getExistingAuthTokens.mockReturnValue(getStoredTokens({ idToken: '' }));

    // Act
    const result = await getAuthIdToken();

    // Assert
    expect(result).toBe('new-id-token');
    expect(logger.info).toHaveBeenCalledWith('No existing session found...');
    expect(jwtDecode).not.toHaveBeenCalled();
  });

  it('should open the sign in page when the stored ID token has expired', async () => {
    // Arrange
    jwtDecode.mockReturnValue({ exp: getPastExpiry() });

    // Act
    const result = await getAuthIdToken();

    // Assert
    expect(result).toBe('new-id-token');
    expect(logger.info).toHaveBeenCalledWith(
      'ID token has expired, refreshing ID token...'
    );
    expect(startRedirectServer).toHaveBeenCalledTimes(1);
  });

  it('should treat a stored ID token with no expiry claim as expired', async () => {
    // Arrange
    jwtDecode.mockReturnValue({});

    // Act
    const result = await getAuthIdToken();

    // Assert
    expect(result).toBe('new-id-token');
    expect(startRedirectServer).toHaveBeenCalledTimes(1);
  });

  it('should persist the tokens returned by the redirect server', async () => {
    // Arrange
    getExistingAuthTokens.mockReturnValue(null);

    // Act
    await getAuthIdToken();

    // Assert
    expect(writeAuthTokens).toHaveBeenCalledWith(NEW_TOKENS);
  });

  it('should start the redirect server on the free port with a dash-free unique reference', async () => {
    // Arrange
    getExistingAuthTokens.mockReturnValue(null);

    // Act
    await getAuthIdToken();

    // Assert
    expect(getPortPromise).toHaveBeenCalledTimes(1);
    expect(startRedirectServer).toHaveBeenCalledWith(
      FREE_PORT,
      UNIQUE_REF,
      expect.any(Function)
    );
  });

  it('should prompt the user to sign in before opening the page', async () => {
    // Arrange
    getExistingAuthTokens.mockReturnValue(null);

    // Act
    await getAuthIdToken();

    // Assert
    expect(logger.info).toHaveBeenCalledWith('Opening sign in page...');
    expect(logger.info).toHaveBeenCalledWith(
      'Please sign in or sign up to continue...'
    );
  });

  it('should reject when reading the stored tokens throws', async () => {
    // Arrange
    getExistingAuthTokens.mockImplementation(() => {
      throw new Error('EACCES');
    });

    // Act / Assert
    await expect(getAuthIdToken()).rejects.toThrow('EACCES');
  });

  it('should reject when the stored ID token cannot be decoded', async () => {
    // Arrange
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token specified');
    });

    // Act / Assert
    await expect(getAuthIdToken()).rejects.toThrow('Invalid token specified');
    expect(startRedirectServer).not.toHaveBeenCalled();
  });

  // `openSignInPage` is async, so these failures surface as a rejected promise
  // rather than a synchronous throw. Before they were passed on to the caller
  // they became unhandled rejections and `getAuthIdToken` never settled.
  it('should reject when no free port can be found', async () => {
    // Arrange
    getExistingAuthTokens.mockReturnValue(null);
    getPortPromise.mockRejectedValueOnce(new Error('No open port found'));

    // Act / Assert
    await expect(getAuthIdToken()).rejects.toThrow('No open port found');
    expect(startRedirectServer).not.toHaveBeenCalled();
  });

  it('should reject when the redirect server cannot be started', async () => {
    // Arrange
    getExistingAuthTokens.mockReturnValue(null);
    startRedirectServer.mockRejectedValueOnce(new Error('EADDRINUSE'));

    // Act / Assert
    await expect(getAuthIdToken()).rejects.toThrow('EADDRINUSE');
    expect(open).toHaveBeenCalledTimes(1);
  });
});
