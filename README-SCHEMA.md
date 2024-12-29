# Schema Documentation

The GraphQL schema files are used to define the entities within your system and relationships between them. The schema files are used to generate the resolvers and types for the GraphQL server.

There are many directives available for the AutoGraphCraft schema files. The following is a list of the available directives and their descriptions:

## Directives

| Directive | Description |
| --------- | ----------- |
| `@model`  | Used to specify that the type should be used to generate resolvers. |
| `@index`  | Used to specify that the field should be indexed in the database. |
| `@hasOne` | Used to specify that the field is a one-to-one relationship with another type with an `@model` directive |
| `@hasMany` | Used to specify that the field is a one-to-many relationship with another type with an `@model` directive |
| `@modelAuth` | Used to specify the authorisation rules associated with the type |
| `@fieldAuth` | Used to specify the authorisation rules associated with the a field |

### `@model`

See the [Model Directive Documentation](./README-DIRECTIVE-MODEL.md) for more information.

### `@index`

See the [Index Directive Documentation](./README-DIRECTIVE-INDEX.md) for more information.

### `@hasOne`

See the [Relationship Directive Documentation](./README-DIRECTIVE-RELATIONSHIPS.md) for more information.

### `@hasMany`

See the [Relationship Directive Documentation](./README-DIRECTIVE-RELATIONSHIPS.md) for more information.

### `@modelAuth`

See the [Model Auth Directive Documentation](./README-DIRECTIVE-MODEL-AUTH.md) for more information.

### `@fieldAuth`

See the [Field Auth Directive Documentation](./README-DIRECTIVE-FIELD-AUTH.md) for more information.
