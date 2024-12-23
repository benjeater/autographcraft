import mongoose from 'mongoose';
import type {
  DATABASE_CODES,
  MONGO_DB_CONNECTION_LIBRARY,
  RootModelAuthorisationDetail,
  Logger,
} from '../../types';

/**
 * The parameters required to initialise the AutoGraphCraftAuthorisation class
 * @param databaseType The type of database being used (taken from the autographcraft config file)
 * @param mongoDbConnectionLibrary The library used to connect to the MongoDB database (taken from the autographcraft config file)
 * @param mongooseConnection The Mongoose connection object (if using Mongoose)
 * @param authorisationStructure The authorisation structure provided by the user (taken from the autographcraft config file)
 * @param logger The logger object (optional)
 * @param isAdmin Whether the user is an admin and should be able to access the authModel directives with a `authorisingModel` of `admin` (optional)
 */
export type AutoGraphCraftAuthorisationParams = {
  databaseType: DATABASE_CODES;
  mongoDbConnectionLibrary: MONGO_DB_CONNECTION_LIBRARY;
  mongooseConnection: mongoose.Connection;
  authorisationStructure: RootModelAuthorisationDetail[];
  logger?: Logger;
};

export type AutoGraphCraftAuthorisationInitialisationParams = {
  rootIds?: Record<string, string>;
  isAdmin?: boolean;
};
