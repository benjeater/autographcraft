import {
  jest,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import type { AutoGraphCraftConfiguration } from '@autographcraft/core';
import { AUTOGRAPHCRAFT_API_URL } from '../../../constants';

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

// `../helpers` re-exports `validateSchema`, which pulls in @graphql-codegen/cli;
// codegen 7 depends on yargs 18 and chalk 5, neither of which Jest's ESM loader
// can link. Stubbing it lets the real `getFileGenerationQuery` be used here.
jest.unstable_mockModule('@graphql-codegen/cli', () => ({
  generate: jest.fn(),
}));

const { logger } = await import('@autographcraft/core');
const { getAutoGraphCraftApiResponse } =
  await import('../getAutoGraphCraftApiResponse');
const { getFileGenerationQuery } =
  await import('../../helpers/getFileGenerationQuery');

const fetchMock = jest.fn<typeof fetch>();
const originalFetch = global.fetch;

const CONFIGURATION = {
  schemaSourceDirectory: 'src/schema',
} as AutoGraphCraftConfiguration;

const SCHEMA = 'type Test { id: ID }';

const GENERATE_RESULT = {
  signedUrl: 'https://example.com/signed',
  warnings: ['a warning'],
  executionDurationMs: 42,
};

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

describe('getAutoGraphCraftApiResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    fetchMock.mockResolvedValue(
      getResponse({ json: { data: { generate: GENERATE_RESULT } } })
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should be defined', () => {
    // Assert
    expect(getAutoGraphCraftApiResponse).toBeDefined();
  });

  it('should return the generate payload from the API response', async () => {
    // Act
    const result = await getAutoGraphCraftApiResponse(
      'the-id-token',
      CONFIGURATION,
      SCHEMA
    );

    // Assert
    expect(result).toEqual(GENERATE_RESULT);
  });

  it('should post the file generation query with the configuration and schema as variables', async () => {
    // Act
    await getAutoGraphCraftApiResponse('the-id-token', CONFIGURATION, SCHEMA);

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(AUTOGRAPHCRAFT_API_URL);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      query: getFileGenerationQuery(),
      variables: {
        configuration: JSON.stringify(CONFIGURATION),
        schema: SCHEMA,
      },
    });
  });

  it('should send the auth token in the Authorization header', async () => {
    // Act
    await getAutoGraphCraftApiResponse('the-id-token', CONFIGURATION, SCHEMA);

    // Assert
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'the-id-token',
    });
  });

  it('should throw the response body when the API returns a client error', async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      getResponse({ status: 401, text: 'Unauthorized' })
    );

    // Act / Assert
    await expect(
      getAutoGraphCraftApiResponse('bad-token', CONFIGURATION, SCHEMA)
    ).rejects.toThrow('Unauthorized');
  });

  it('should throw the response body when the API returns a server error', async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      getResponse({ status: 500, text: 'Internal server error' })
    );

    // Act / Assert
    await expect(
      getAutoGraphCraftApiResponse('the-id-token', CONFIGURATION, SCHEMA)
    ).rejects.toThrow('Internal server error');
  });

  it('should throw the first GraphQL error and log the whole response', async () => {
    // Arrange
    const responseJson = {
      data: { generate: null },
      errors: [
        { message: 'Schema is invalid', errorType: 'BadRequest' },
        { message: 'A second error' },
      ],
    };
    fetchMock.mockResolvedValue(getResponse({ json: responseJson }));

    // Act / Assert
    await expect(
      getAutoGraphCraftApiResponse('the-id-token', CONFIGURATION, SCHEMA)
    ).rejects.toThrow('Schema is invalid');
    expect(logger.error).toHaveBeenCalledWith(
      JSON.stringify(responseJson, null, 2)
    );
  });

  it('should not log an error when the response carries no errors', async () => {
    // Act
    await getAutoGraphCraftApiResponse('the-id-token', CONFIGURATION, SCHEMA);

    // Assert
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should propagate a network failure', async () => {
    // Arrange
    fetchMock.mockRejectedValue(new Error('fetch failed'));

    // Act / Assert
    await expect(
      getAutoGraphCraftApiResponse('the-id-token', CONFIGURATION, SCHEMA)
    ).rejects.toThrow('fetch failed');
  });
});
