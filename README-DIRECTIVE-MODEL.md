# `@model` Directive Documentation

The `@model` directive is used to specify that the type should be used to generate resolvers.

- [`@model` Directive Documentation](#model-directive-documentation)
  - [Directive Specification](#directive-specification)
  - [Usage](#usage)
  - [Generation Output](#generation-output)

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

The `@model` directive must include the `id: ID!` field.  This field is used to uniquely identify the document in the database and to connect documents together.  If this field is not included, the generation process will fail.

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

## Generation Output

The `@model` directive will add three (3) timestamp fields to the type:

- `createdAt: ISO8601DateTime!` - The date and time the document was created
- `updatedAt: ISO8601DateTime!` - The date and time the document was last updated
- `deletedAt: ISO8601DateTime` - The date and time the document was deleted

These fields are not editable via the API and are automatically set by the system.  The fields will return the timestamp of the event is ISO8601 datetime format at UTC (e.g. `2024-03-02T01:23:45.678Z`)

The `deletedAt` field is only set when a document is deleted and is used to mark the document as deleted without actually removing it from the database.  Using this soft-delete method allows for the document to be restored if needed.  

> **&#9432; NOTE:**  
> Database entries with a populated value for `deletedAt` are automatically filtered out from `list` queries.  If you want to include deleted database entries in the API response, include a `filter` in the request to get the results you want:

```json
{
  "filter": {
    "or": [
      // return non-deleted records
      {
        "deletedAt": {
          "exists": false
        }
      },
      // return deleted records
      {
        "deletedAt": {
          "exists": true
        }
      }
    ]
  }
}
```
