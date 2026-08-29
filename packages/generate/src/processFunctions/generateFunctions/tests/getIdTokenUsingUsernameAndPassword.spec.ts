import {
  jest,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { getIdTokenUsingUsernameAndPassword } from '../getIdTokenUsingUsernameAndPassword';
import {
  AUTOGRAPHCRAFT_AUTH_LOGIN_URL,
  AUTOGRAPHCRAFT_CLIENT_ID,
} from '../../../constants';

const fetchMock = jest.fn<typeof fetch>();
const originalFetch = global.fetch;

function getResponse(overrides: {
  status?: number;
  json?: unknown;
  text?: string;
}): Response {
  return {
    status: overrides.status ?? 200,
    json: async () => overrides.json,
    text: async () => overrides.text ?? '',
  } as unknown as Response;
}

function getAuthResponseBody(idToken = 'the-id-token') {
  return {
    AuthenticationResult: {
      AccessToken: 'the-access-token',
      ExpiresIn: 3600,
      IdToken: idToken,
      RefreshToken: 'the-refresh-token',
      TokenType: 'Bearer',
    },
    ChallengeParameters: {},
  };
}

describe('getIdTokenUsingUsernameAndPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue(getResponse({ json: getAuthResponseBody() }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should be defined', () => {
    // Assert
    expect(getIdTokenUsingUsernameAndPassword).toBeDefined();
  });

  it('should return the ID token from the auth response', async () => {
    // Act
    const result = await getIdTokenUsingUsernameAndPassword('user', 'pass');

    // Assert
    expect(result).toBe('the-id-token');
  });

  it('should post the USER_PASSWORD_AUTH flow to the cognito endpoint', async () => {
    // Act
    await getIdTokenUsingUsernameAndPassword('user', 'pass');

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(AUTOGRAPHCRAFT_AUTH_LOGIN_URL);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({
      'content-type': 'application/x-amz-json-1.1',
      'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    });
    expect(JSON.parse(init?.body as string)).toEqual({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: AUTOGRAPHCRAFT_CLIENT_ID,
      AuthParameters: {
        USERNAME: 'user',
        PASSWORD: 'pass',
      },
    });
  });

  it('should throw the response body when the request is rejected', async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      getResponse({ status: 400, text: 'Incorrect username or password.' })
    );

    // Act / Assert
    await expect(
      getIdTokenUsingUsernameAndPassword('user', 'wrong')
    ).rejects.toThrow('Incorrect username or password.');
  });

  it('should throw the response body when the server errors', async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      getResponse({ status: 500, text: 'Internal server error' })
    );

    // Act / Assert
    await expect(
      getIdTokenUsingUsernameAndPassword('user', 'pass')
    ).rejects.toThrow('Internal server error');
  });

  it('should not read the response body as JSON when the request is rejected', async () => {
    // Arrange
    const json = jest.fn<() => Promise<unknown>>();
    fetchMock.mockResolvedValue({
      status: 401,
      json,
      text: async () => 'Unauthorized',
    } as unknown as Response);

    // Act
    await expect(
      getIdTokenUsingUsernameAndPassword('user', 'pass')
    ).rejects.toThrow('Unauthorized');

    // Assert
    expect(json).not.toHaveBeenCalled();
  });

  it('should propagate a network failure', async () => {
    // Arrange
    fetchMock.mockRejectedValue(new Error('fetch failed'));

    // Act / Assert
    await expect(
      getIdTokenUsingUsernameAndPassword('user', 'pass')
    ).rejects.toThrow('fetch failed');
  });
});
