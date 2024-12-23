/** @type {import('@autographcraft/core').AutoGraphCraftConfigurationOutput} **/
const config = {
  generatedTypesDirectory: 'generated/generatedTypes',
  generatedDatabaseDirectory: 'generated/generatedDatabase',
  generatedUtilsDirectory: 'generated/utils',
  generatedModelsDirectory: 'generated/models',
  queriesDirectory: 'generated/queries',
  mutationsDirectory: 'generated/mutations',
  schemaSourceDirectory: 'testData/schemas',
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
