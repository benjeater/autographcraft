# `@fieldAuth` Directive Documentation

The `@fieldAuth` directive is used to specify the authorisation rules associated with the a field on a specific type.  This directive is used in conjunction with the `authorisationStructure` settings in the `autographcraft.config.js` file.

The format of the `@fieldAuth` directive closely follows that of the `@modelAuth` directive. This documentation extends the [@modelAuth Directive Documentation](./README-DIRECTIVE-MODEL-AUTH.md) and they should be used in conjunction with each other.

This documentation is created for the purpose of explaining the functionality of the `@fieldAuth` directive and should not be considered a guide on best practice for authorisation within your application.

## Directive Specification

The full directive is specified as:

```graphql
directive @fieldAuth(authorisingModel: String!, idField: String, methods: [AUTH_METHOD!]!) on FIELD_DEFINITION

enum AUTH_METHOD {
  create
  read
  update
  delete
  list
  all
}
```

The directive has three parameters:

| Parameter | Description |
| --------- | ----------- |
| `authorisingModel` | The name of a model specified in the `autographcraft.config.js` file or one of the following \[`public`, `signedIn`\] |
| `idField` | The name of the field on the model specified in `authorisingModel` to use as the value for the authorisation check.  Can be omitted for `public` and `signedIn` `authorisingModel` values |
| `methods` | An array of methods that the authorised caller can use on the model |

## Setting up Authorising Models

See the [Configuration Documentation](./README-CONFIGURATION.md) for more information.

## Usage

The `@fieldAuth` directive is used to specify that the a field on a specific type should only be accessible to some API callers, and which resolvers those callers have access to.  The schema below defines a simple application and will be used for this documentation.

```graphql
type User 
  @model
  @modelAuth(
    authorisingModel: "signedIn"
    methods: [read]
  ) 
  @modelAuth(
    authorisingModel: "User"
    idField: "id"
    methods: [read, update, delete, list]
  ) {
  id: ID!
  name: String!
  email: String!
  posts: [Post] @hasMany(targetIndexName: "byCreatedByUserId")
  userOnlyReadField: String @fieldAuth(authorisingModel: "User", idField: "id", methods: [read]) # <-- This is the field with the @fieldAuth directive
}
```

On the specified model `User` there is a field called `userOnlyReadField`.  This field has been annotated with the `@fieldAuth` directive.  If you need more information on the `@modelAuth` directive, see the [@modelAuth Directive Documentation](./README-DIRECTIVE-MODEL-AUTH.md).

The `@fieldAuth` directive specifies that only the `User` this model represents can read the `userOnlyReadField` field.  All other callers will receive `null` when querying this field.  Because this field is only readable by the `User` represented by the document, the field must be nullable so that the `null` value can be returned to other callers.

> **&#9432; NOTE:**  
> The `@fieldAuth` directive cannot be used on the `id` field of a model.  This is because the `id` field is mandatory and there must always be returned if any other field is returned from the requested database entry.

Adding the `@fieldAuth` directive to a field will not affect the visibility of the field in the GraphQL schema.  The field will still be visible to all callers on the GraphQL introspection query, but only the authorised callers will be able to read or write to the field.

Adding the `fieldAuth` directive to a field will remove the functionality of the `@modelAuth` directives on the type.  The `@fieldAuth` directive will take precedence over the `@modelAuth` directive.  This means that if a field has a `@fieldAuth` directive, the `@modelAuth` directives will be ignored for that field and any methods specified in the `@modelAuth` directive will not be available to the caller unless they are also specified in a `@fieldAuth` directive for the field.  For example:

```graphql
type User 
  @model
  @modelAuth(
    authorisingModel: "User"
    idField: "id"
    methods: [read, update, delete, list]
  ) 
  @modelAuth(
    authorisingModel: "admin"
    methods: [all]
  ) {
  id: ID!

  # Whoops! 
  # The admin now has no access to this field because the @fieldAuth directive takes precedence over the @modelAuth directive
  userOnlyReadField: String @fieldAuth(authorisingModel: "User", idField: "id", methods: [read]) 
}
```

This can be rectified by adding a `@fieldAuth` directive to the field that specifies the `admin` authorising model:

```graphql
type User 
  @model
  @modelAuth(
    authorisingModel: "User"
    idField: "id"
    methods: [read, update, delete, list]
  ) 
  @modelAuth(
    authorisingModel: "admin"
    methods: [all]
  ) {
  id: ID!

  # Phew! 
  # The admin now has full access to this field again
  userOnlyReadField: String
    @fieldAuth(authorisingModel: "User", idField: "id", methods: [read]) 
    @fieldAuth(authorisingModel: "admin", methods: [all]) 
}
```

## Special Authorising Models

Details on the special authorising models can be found in the [@authModel Directive Documentation](./README-DIRECTIVE-MODEL-AUTH.md#special-authorising-models).
