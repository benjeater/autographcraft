# Model Relationship Directives Documentation

The `@hasOne` and `@hasMany` directives are collectively known as the relationship directives.  These directives are used to specify the relationships between models in the schema.

## Directive Specifications

The full `@hasOne` directive is specified as:

```graphql
directive @hasOne(idField: String!) on FIELD_DEFINITION
```

The full `@hasMany` directive is specified as:

```graphql
directive @hasMany(targetIndexName: String!) on FIELD_DEFINITION
```

## Usage

### `@hasOne`

The `@hasOne` directive is used to specify that the field is a one-to-one relationship with another type with an `@model` directive.  The `@hasOne` directive can be used on any field that is a root field in a type with an `@model` directive and whose type is another type with an `@model` directive.

```graphql
type User @model {
  id: ID!
  name: String!
  email: String!
}

type Post @model {
  id: ID!
  createdByUserId: ID! @index(name: "byCreatedByUserId")
  user: User @hasOne(idField: "createdByUserId")
  title: String!
  content: String!
}
```

In the above example, the `Post` model has a one-to-one relationship with the `User` model.  The `user` field on the `Post` type is specified with the type of `User` and joined with the `@hasOne` directive.  The `idField` argument on the `@hasOne` directive is used to specify the field on the `Post` that stores the `id` field value of the `User` that is being joined.

### `@hasMany`

The `@hasMany` directive is used to specify that the field is a one-to-many relationship with another type with an `@model` directive.  The `@hasMany` directive can be used on any field that is a root field in a type with an `@model` directive and whose type is another type with an `@model` directive.

```graphql
type User @model {
  id: ID!
  name: String!
  posts: [Post] @hasMany(targetIndexName: "byCreatedByUserId")
}

type Post @model {
  id: ID!
  createdByUserId: ID! @index(name: "byCreatedByUserId")
  title: String!
  content: String!
}
```

In the above example, the `User` model has a one-to-many relationship with the `Post` model.  The `posts` field on the `User` type is specified with the type of `[Post]` and joined with the `@hasMany` directive.  The `targetIndexName` argument on the `@hasMany` directive is used to specify the index name on the `Post` model that is used to join the `User` and `Post` models.  The resolver will use the `id` field of the `User` model to query the `Post` model based on the `createdByUserId` field when a query requests the `posts` field on the `User` model.
