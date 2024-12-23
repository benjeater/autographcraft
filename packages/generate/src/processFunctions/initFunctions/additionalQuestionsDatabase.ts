import {
  type AutoGraphCraftConfiguration,
  DATABASE_CODES,
} from '@autographcraft/core';
import { questionMongoDbConnectionLibrary } from './questions';

type AutoGraphCraftConfigurationDatabaseKeys = Pick<
  AutoGraphCraftConfiguration,
  'mongoDbConnectionLibrary'
>;

export async function additionalQuestionsDatabase(
  databaseType: DATABASE_CODES
): Promise<AutoGraphCraftConfigurationDatabaseKeys> {
  switch (databaseType) {
    case DATABASE_CODES.MONGO_DB:
      return await additionalQuestionsMongoDB();
    case DATABASE_CODES.DYNAMO_DB:
      return await additionalQuestionsDynamoDB();
    case DATABASE_CODES.POSTGRESQL:
      return await additionalQuestionsPostgreSQL();
    default:
      throw new Error('Invalid database type provided');
  }
}

async function additionalQuestionsMongoDB(): Promise<AutoGraphCraftConfigurationDatabaseKeys> {
  const mongoDbConnectionLibrary = await questionMongoDbConnectionLibrary();
  return { mongoDbConnectionLibrary };
}

async function additionalQuestionsDynamoDB(): Promise<AutoGraphCraftConfigurationDatabaseKeys> {
  return {};
}

async function additionalQuestionsPostgreSQL(): Promise<AutoGraphCraftConfigurationDatabaseKeys> {
  return {};
}
