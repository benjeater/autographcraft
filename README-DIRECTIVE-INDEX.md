# `@index` Directive Documentation

The `@index` directive is used to specify that the field should be indexed in the database.

## Directive Specification

The full directive is specified as:

```graphql
directive @index(name: String!) on FIELD_DEFINITION
```

## Usage

The `@index` directive is used to specify that a field should be indexed in the database.  The `@index` directive can be used on any field in the schema except for the required field for each `@model` annotated type (i.e. the `id` field).

```graphql
type Post @model {
  id: ID!
  createdByUserId: ID! @index(name: "byCreatedByUserId")
  title: String!
  content: String!
}
```

## Index Directive Requirements

Indexes are required for fields used in the `@hasOne` and `@hasMany` directives.  The queries used to join the models would have serious performance issues if the fields were not indexed.

Index directives can only be placed on the fields at the root level of a type with an `@model` directive.  Index directives cannot be placed on fields within a list or object type.

## Index Directive Recommendations

It is recommended that the `@index` directive is used on fields that are used in queries to improve the performance of the database.  For example, in the schema above, the `createdByUserId` field is indexed to improve the performance of queries that filter by the `createdByUserId` field.

It is required that the index name is unique for each field in the type.  If the same index name is used on multiple fields, the schema generation will fail.
