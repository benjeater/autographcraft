/** @type {import('@benjeater/autographcraft').AutoGraphCraftConfiguration} **/
export const config = {
  generatedTypesDirectory: 'generatedTypes',
  generatedDatabaseDirectory: 'generatedDatabase',
  generatedUtilsDirectory: 'generatedUtils',
  generatedModelsDirectory: 'models',
  queriesDirectory: 'queries',
  mutationsDirectory: 'mutations',
  schemaSourceDirectory: 'schemas',
  gitIgnorePath: '.gitIgnore',
  databaseType: 'MONGO_DB',
  mongoDbConnectionLibrary: 'MONGOOSE',
  authorisationStructure: [
    {
      targetModelName: 'User',
      joins: [],
    },
  ],
};

export default config;
