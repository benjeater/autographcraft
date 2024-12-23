<h1 align="center">Welcome to AutoGraphCraft 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.2-blue.svg?cacheSeconds=2592000" />
</p>

- [Description](#description)
- [Install](#install)
- [Setup](#setup)
  - [Initialise the Package](#initialise-the-package)
  - [Implement the Package](#implement-the-package)
  - [Update Configuration](#update-configuration)
- [Usage](#usage)
  - [Specifying the Schema](#specifying-the-schema)
  - [Implementing the Generated Output](#implementing-the-generated-output)
- [Author](#author)
- [Show your support](#show-your-support)

## Description

AutoGraphCraft can generate an entire GraphQL API from GraphQL schema files, including the resolver functions, authorisation logic, entity relationships, database schema and typescript types.

## Install

The AutoGraphCraft requires two packages to be installed; the generation package and a resolver package.

The generate package is only required as part of your build process, so should be installed as a dev dependency:

```sh
npm install @autographcraft/generate --save-dev
```

Then you will need to install a resolver package. This package will be used to resolve the data from your database. The resolver package should be installed as a regular dependency:

```sh
npm install @autographcraft/[package-name]
```

For instance, if you wanted to use MongoDB as your database, you would install the MongoDB package by running:

```sh
npm install @autographcraft/mongodb
```

## Setup

### Initialise the Package

The package needs to be initalised before it is first run, otherwise it will not be able to generate any output. The initialisation will perform two steps:

1. Add the `autographcraft.config.js` file to the root of your project
2. Add additional configuration to your `gitignore` file

The configuration file will specify where the source and target directories are for the generation process. Each of these options is detailed in the [Configuration Readme](./README-CONFIGURATION.md).

The initialisation is a guided process to create the configuration which can be called with:

```sh
npx autographcraft init
```

If you wish to initialise with the default settings, use:

```sh
npx autographcraft init --default
```

### Implement the Package

Add the following script to your `package.json` file:

```json
"scripts": {
  "generate": "npx autographcraft generate"
}
```

If you wish to have the types generated on every build (recommended), add `generate` to the `prebuild` script:

```json
"scripts": {
  "prebuild": "npm run generate",
  "generate": "npx autographcraft generate"
}
```

### Update Configuration

The configuration should be updated via the `config set` command. Further details can be found in the [Configuration Readme](./README-CONFIGURATION.md).

## Usage

### Specifying the Schema

In order to generate the types, you will need to specify the schema. This is done by creating `.graphql` files in the `schemaSourceDirectory` directory specified in the `autographcraft.config.js` file.

A standard schema file for a user might look like:

```graphql
type User @model {
  id: ID!
  name: String!
  email: String!
}
```

The `@model` directive on the `User` type is used to specify that this type should be used to generate resolvers. The `id` field is required and should be of type `ID!`.  All other fields are optional.

Models can be connected to other models by specifying a field as a type of another model.  In the example below, a `User` can have many `Post`s and a `Post` can have one `User`:

```graphql
type User @model {
  id: ID!
  name: String!
  email: String!
  posts: [Post] @hasMany(targetIndexName: "byCreatedByUserId")
}

type Post @model {
  id: ID!
  createdByUserId: ID! @index(name: "byCreatedByUserId")
  user: User @hasOne(idField: "createdByUserId")
  title: String!
  content: String!
}
```

Further information on how to define schemas can be found in the [Schema Readme](./README-SCHEMA.md).

### Implementing the Generated Output

The generated files includes the resolvers, typedefs, and context generation for a GraphQL server.  The resolvers have been tested with [Apollo Server](https://www.apollographql.com/docs/apollo-server) and [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server), but should work with most GraphQL servers.

The resolvers can be found in the directory specified by the `generatedTypesDirectory` in the `autographcraft.config.js` file and can be imported using the default export:

```typescript
import resolvers from './generatedTypes/resolvers'
```

The typedefs can be found in the directory specified by the `generatedTypesDirectory` in the `autographcraft.config.js` file and can be imported using the `loadFiles` utility from `@graphql-tools/load-files`:

```typescript
import { loadFiles } from "@graphql-tools/load-files";
const typeDefs = await loadFiles("src/generatedTypes/typeDefs.graphql");
```

These can then be combined to create the schema for the GraphQL server:

```typescript
import { ApolloServer } from 'apollo-server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { loadFiles } from '@graphql-tools/load-files';
import resolvers from './generatedTypes/resolvers';

const typeDefs = await loadFiles('src/generatedTypes/typeDefs.graphql');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
```

The context can be generated using the `createAutoGraphCraftContext` function from the `generatedUtilsDirectory` in the `autographcraft.config.js` file:

```typescript
import { createAutoGraphCraftContext } from './generatedTypes/utils';

const context = async (initialContext) => {
  // Create the context required for the resolvers
  const autographcraftContext = await createAutoGraphCraftContext(
    autoGraphCraftContextParams,
  );
  
  // Combine the initial context with the autographcraft context
  const context = {
    ...initialContext,
    ...autographcraftContext,
  };
  return context;
};
```

An example of how to implement the resolvers with GraphQL Yoga can be found in the [Examples](./examples) directory.

## Author

👤 **Ben Jeater <benjeater+autographcraft@gmail.com>**

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
