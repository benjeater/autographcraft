import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import {
  DATABASE_CODES,
  MONGO_DB_CONNECTION_LIBRARY,
} from '@autographcraft/core';

// ESM has no automocking, so the question module this unit delegates to is
// named explicitly; a real prompt would block the test run.
const questionMongoDbConnectionLibrary =
  jest.fn<() => Promise<MONGO_DB_CONNECTION_LIBRARY>>();

jest.unstable_mockModule('../questions', () => ({
  questionMongoDbConnectionLibrary,
}));

const { additionalQuestionsDatabase } =
  await import('../additionalQuestionsDatabase');

describe('additionalQuestionsDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    questionMongoDbConnectionLibrary.mockResolvedValue(
      MONGO_DB_CONNECTION_LIBRARY.MONGOOSE
    );
  });

  it('should be defined', () => {
    // Assert
    expect(additionalQuestionsDatabase).toBeDefined();
  });

  it('should ask for the connection library when MongoDB is selected', async () => {
    // Arrange
    questionMongoDbConnectionLibrary.mockResolvedValueOnce(
      MONGO_DB_CONNECTION_LIBRARY.MONGOSH
    );

    // Act
    const result = await additionalQuestionsDatabase(DATABASE_CODES.MONGO_DB);

    // Assert
    expect(result).toEqual({
      mongoDbConnectionLibrary: MONGO_DB_CONNECTION_LIBRARY.MONGOSH,
    });
    expect(questionMongoDbConnectionLibrary).toHaveBeenCalledTimes(1);
  });

  it('should ask no further questions when DynamoDB is selected', async () => {
    // Act
    const result = await additionalQuestionsDatabase(DATABASE_CODES.DYNAMO_DB);

    // Assert
    expect(result).toEqual({});
    expect(questionMongoDbConnectionLibrary).not.toHaveBeenCalled();
  });

  it('should ask no further questions when PostgreSQL is selected', async () => {
    // Act
    const result = await additionalQuestionsDatabase(DATABASE_CODES.POSTGRESQL);

    // Assert
    expect(result).toEqual({});
    expect(questionMongoDbConnectionLibrary).not.toHaveBeenCalled();
  });

  it('should throw for an unrecognised database type', async () => {
    // Act / Assert
    await expect(
      additionalQuestionsDatabase('SQLITE' as DATABASE_CODES)
    ).rejects.toThrow('Invalid database type provided');
    expect(questionMongoDbConnectionLibrary).not.toHaveBeenCalled();
  });
});
