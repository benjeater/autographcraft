import {
  jest,
  beforeEach,
  afterAll,
  describe,
  expect,
  it,
} from '@jest/globals';
import { join, sep } from 'path';
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
    expect(result).toEqual([
      {
        ...getFiles()[0],
        filePath: join('src', 'generatedTypes', 'typedefs.graphql'),
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(apiResponse.signedUrl);
  });

  // The API always returns root-anchored, forward-slash paths, and every
  // consumer writes `filePath` straight to the file system, so they are
  // normalised here rather than by any one of those consumers.
  it('should strip the leading slash and use the platform path separator', async () => {
    // Arrange
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(getFiles()), { status: 200 })
    );

    // Act
    const [result] = await getFilesFromResponse(apiResponse);

    // Assert
    expect(result.filePath.startsWith(sep)).toBe(false);
    expect(result.filePath).toBe(
      ['src', 'generatedTypes', 'typedefs.graphql'].join(sep)
    );
  });

  it('should leave an already normalised path alone', async () => {
    // Arrange
    const filePath = ['src', 'models', 'User', 'index.ts'].join(sep);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify([{ ...getFiles()[0], filePath }]), {
        status: 200,
      })
    );

    // Act
    const [result] = await getFilesFromResponse(apiResponse);

    // Assert
    expect(result.filePath).toBe(filePath);
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
