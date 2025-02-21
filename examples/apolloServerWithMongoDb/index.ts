import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { loadFiles } from '@graphql-tools/load-files';
import mongoose from 'mongoose';
import resolvers from './generatedTypes/resolvers'; // The resolvers generated by AutoGraphCraft
import {
  type AutoGraphCraftContextParams,
  createAutoGraphCraftContext, // The create context function generated by AutoGraphCraft
} from './generatedUtils';

import { config } from './autographcraft.config.js';

// Constants
const SERVER_PORT = 3000;
const MONGODB_URI = 'mongodb://localhost:27017/autographcraft';

// Connect to the database (MongoDB in this case)
const mongooseConnection = mongoose.createConnection(MONGODB_URI);

async function context(initialContext) {
  // Create the data that will be used by the create context function
  const autoGraphCraftContextParams: AutoGraphCraftContextParams = {
    mongooseConnection,
    logger: console,
    config,
    authInitialisationData: { User: initialContext.userId },
    isAdmin: initialContext.isAdmin || false,
  };

  // Create the context required for the resolvers
  const autographcraftContext = await createAutoGraphCraftContext(
    autoGraphCraftContextParams
  );

  // Combine the initial context with the autographcraft context
  const combinedContext = {
    ...initialContext,
    ...autographcraftContext,
  };
  return combinedContext;
}

async function main() {
  // Read the typeDefs from the generated file
  const typeDefs = await loadFiles('src/generatedTypes/typeDefs.graphql');

  // Create the Apollo server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start the server
  const { url } = await startStandaloneServer(server, {
    listen: { port: SERVER_PORT },
    context,
  });

  console.log(`🚀  Server ready at: ${url}`);
}

main();
