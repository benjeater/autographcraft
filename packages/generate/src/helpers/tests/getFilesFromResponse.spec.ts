import {
  jest,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import type { OutputFileDetail } from '@autographcraft/core';
import { getFilesFromResponse } from '../getFilesFromResponse';
import type { AutoGraphCraftApiResponse } from '../../types';

// The unit fetches the signed URL, so the global `fetch` is replaced for the
// duration of the suite; no network request is ever made.
const originalFetch = globalThis.fetch;
const fetchMock = jest.fn<typeof fetch>();

const apiResponse: AutoGraphCraftApiResponse = {
  signedUrl: 'https://example.com/signed-url',
  executionDurationMs: 123,
  warnings: [],
};

function getFiles(): OutputFileDetail[] {
  return [
    {
      filePath: '/src/generatedTypes/typedefs.graphql',
      content: 'type Query { id: ID }',
      addIgnoreHeader: true,
      shouldOverwrite: true,
    },
  ];
}

describe('getFilesFromResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('should be defined', () => {
    // Assert
    expect(getFilesFromResponse).toBeDefined();
  });

  it('should fetch the signed url and return the parsed files', async () => {
    // Arrange
    const files = getFiles();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(files), { status: 200 })
    );

    // Act
    const result = await getFilesFromResponse(apiResponse);

    // Assert
    expect(result).toEqual(files);
    expect(fetchMock).toHaveBeenCalledWith(apiResponse.signedUrl);
  });

  it('should throw the response body when the status is an error', async () => {
    // Arrange
    fetchMock.mockResolvedValueOnce(
      new Response('Access denied', { status: 403 })
    );

    // Act / Assert
    await expect(getFilesFromResponse(apiResponse)).rejects.toThrow(
      'Access denied'
    );
  });

  it('should throw when the signed url does not return an array', async () => {
    // Arrange
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ notAn: 'array' }), { status: 200 })
    );

    // Act / Assert
    await expect(getFilesFromResponse(apiResponse)).rejects.toThrow(
      'The signed URL did not return an array of files'
    );
  });

  it('should throw when the signed url does not return valid JSON', async () => {
    // Arrange
    fetchMock.mockResolvedValueOnce(new Response('not json', { status: 200 }));

    // Act / Assert
    await expect(getFilesFromResponse(apiResponse)).rejects.toBeInstanceOf(
      SyntaxError
    );
  });
});
