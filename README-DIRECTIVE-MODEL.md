# `@model` Directive Documentation

The `@model` directive is used to specify that the type should be used to generate resolvers.

## Directive Specification

The full directive is specified as:

```graphql
directive @model(queries: ModelQueries, mutations: ModelMutations) on OBJECT

input ModelQueries {
  read: Boolean
  list: Boolean
}

input ModelMutations {
  create: Boolean
  update: Boolean
  delete: Boolean
}
```

## Usage

The `@model` directive is used to specify that the type should be used to generate resolvers.  The `@model` directive can be used on any type in the schema.

```graphql
type User @model {
  id: ID!
  name: String!
  email: String!
}
```

In the example above, the `User` type is specified as a model.  This means that the `User` type will be used to generate resolvers.

By default, the following resolvers will be generated for the `User` type:

- `createUser` - Create a new user
- `readUser` - Read a user by ID
- `updateUser` - Update a user by ID
- `deleteUser` - Delete a user by ID
- `listUser` - List users based on the provided filter and auth rules

Specific resolvers can be turned off by specifying them in the model arguments as `false`.  For example, to turn off the `createUser` and `deleteUser` resolvers, the `User` type would be specified as:

```graphql
type User @model(mutations: { create: false, delete: false }) {
  id: ID!
  name: String!
  email: String!
}
```

The values that are not specified in the `queries` or `mutations` arguements will default to `true`.
