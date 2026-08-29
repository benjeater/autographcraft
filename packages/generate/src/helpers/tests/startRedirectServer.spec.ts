import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import type { ServerResponse } from 'node:http';
import { SUCCESS_HTML, FAILURE_HTML } from '../redirectServer';
import type { AuthTokens } from '../../types';

type RequestListener = (req: { url?: string }, res: ServerResponse) => void;

// ESM has no automocking, and no real socket may be opened by a unit test, so
// `node:http` is replaced with a fake server that captures the request handler.
const listen = jest.fn<(port: number) => void>();
let capturedListener: RequestListener | undefined;
const createServer = jest.fn((listener: RequestListener) => {
  capturedListener = listener;
  return { listen };
});

jest.unstable_mockModule('node:http', () => ({
  default: { createServer },
  createServer,
}));

const { startRedirectServer } = await import('../startRedirectServer');

const UNIQUE_REF = 'unique-ref-1234';
const FREE_PORT = 4242;

function getResponse() {
  return {
    writeHead:
      jest.fn<(status: number, headers: Record<string, string>) => void>(),
    write: jest.fn<(chunk: string) => void>(),
    end: jest.fn<() => void>(),
  };
}

describe('startRedirectServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedListener = undefined;
  });

  it('should be defined', () => {
    // Assert
    expect(startRedirectServer).toBeDefined();
  });

  it('should create a server and listen on the supplied port', async () => {
    // Arrange
    const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();

    // Act
    await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);

    // Assert
    expect(createServer).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(FREE_PORT);
    expect(onTokenReceived).not.toHaveBeenCalled();
  });

  it('should respond with the success page and pass the tokens to the callback', async () => {
    // Arrange
    const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();
    await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);
    const res = getResponse();

    // Act
    capturedListener?.(
      {
        url: `/?unique_ref=${UNIQUE_REF}&id_token=testIdToken&access_token=testAccessToken&refresh_token=testRefreshToken`,
      },
      res as unknown as ServerResponse
    );

    // Assert
    expect(onTokenReceived).toHaveBeenCalledWith({
      idToken: 'testIdToken',
      accessToken: 'testAccessToken',
      refreshToken: 'testRefreshToken',
    });
    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/html',
    });
    expect(res.write).toHaveBeenCalledWith(SUCCESS_HTML);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should respond with the failure page when the unique ref is missing', async () => {
    // Arrange
    const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();
    await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);
    const res = getResponse();

    // Act
    capturedListener?.(
      { url: '/?id_token=testIdToken' },
      res as unknown as ServerResponse
    );

    // Assert
    expect(onTokenReceived).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400, {
      'Content-Type': 'text/html',
    });
    expect(res.write).toHaveBeenCalledWith(FAILURE_HTML);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should respond with the failure page when the unique ref does not match', async () => {
    // Arrange
    const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();
    await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);
    const res = getResponse();

    // Act
    capturedListener?.(
      { url: '/?unique_ref=a-different-ref' },
      res as unknown as ServerResponse
    );

    // Assert
    expect(onTokenReceived).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400, {
      'Content-Type': 'text/html',
    });
    expect(res.write).toHaveBeenCalledWith(FAILURE_HTML);
  });

  it('should respond with the failure page when the request has no url', async () => {
    // Arrange
    const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();
    await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);
    const res = getResponse();

    // Act
    capturedListener?.({}, res as unknown as ServerResponse);

    // Assert
    expect(onTokenReceived).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400, {
      'Content-Type': 'text/html',
    });
    expect(res.write).toHaveBeenCalledWith(FAILURE_HTML);
  });

  describe.each([
    ['the id token is missing', 'id_token'],
    ['the access token is missing', 'access_token'],
    ['the refresh token is missing', 'refresh_token'],
  ])('when %s', (_description, omittedParameter) => {
    it('should respond with the failure page and not call the callback', async () => {
      // Arrange
      const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();
      await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);
      const res = getResponse();
      const query = [
        `unique_ref=${UNIQUE_REF}`,
        'id_token=testIdToken',
        'access_token=testAccessToken',
        'refresh_token=testRefreshToken',
      ].filter((parameter) => !parameter.startsWith(`${omittedParameter}=`));

      // Act
      capturedListener?.(
        { url: `/?${query.join('&')}` },
        res as unknown as ServerResponse
      );

      // Assert
      expect(onTokenReceived).not.toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(400, {
        'Content-Type': 'text/html',
      });
      expect(res.write).toHaveBeenCalledWith(FAILURE_HTML);
      expect(res.write).not.toHaveBeenCalledWith(SUCCESS_HTML);
      expect(res.end).toHaveBeenCalledTimes(1);
    });
  });

  it('should respond with the failure page when a token is present but empty', async () => {
    // Arrange
    const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();
    await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);
    const res = getResponse();

    // Act
    capturedListener?.(
      {
        url: `/?unique_ref=${UNIQUE_REF}&id_token=&access_token=testAccessToken&refresh_token=testRefreshToken`,
      },
      res as unknown as ServerResponse
    );

    // Assert
    expect(onTokenReceived).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400, {
      'Content-Type': 'text/html',
    });
    expect(res.write).toHaveBeenCalledWith(FAILURE_HTML);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should respond with the failure page when a token is supplied more than once', async () => {
    // Arrange
    const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();
    await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);
    const res = getResponse();

    // Act
    capturedListener?.(
      {
        url: `/?unique_ref=${UNIQUE_REF}&id_token=testIdToken&id_token=anotherIdToken&access_token=testAccessToken&refresh_token=testRefreshToken`,
      },
      res as unknown as ServerResponse
    );

    // Assert
    expect(onTokenReceived).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(400, {
      'Content-Type': 'text/html',
    });
    expect(res.write).toHaveBeenCalledWith(FAILURE_HTML);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should always either call the callback or write a response', async () => {
    // Arrange
    const onTokenReceived = jest.fn<(authTokens: AuthTokens) => void>();
    await startRedirectServer(FREE_PORT, UNIQUE_REF, onTokenReceived);
    const urls = [
      undefined,
      '/',
      '/?unique_ref=wrong-ref',
      `/?unique_ref=${UNIQUE_REF}`,
      `/?unique_ref=${UNIQUE_REF}&id_token=testIdToken`,
      `/?unique_ref=${UNIQUE_REF}&id_token=testIdToken&access_token=testAccessToken`,
      `/?unique_ref=${UNIQUE_REF}&id_token=testIdToken&access_token=testAccessToken&refresh_token=testRefreshToken`,
    ];

    // Act / Assert
    urls.forEach((url) => {
      const res = getResponse();
      capturedListener?.({ url }, res as unknown as ServerResponse);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
    });
    expect(onTokenReceived).toHaveBeenCalledTimes(1);
  });
});
