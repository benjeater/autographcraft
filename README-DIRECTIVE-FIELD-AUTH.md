# `@fieldAuth` Directive Documentation

The `@fieldAuth` directive is used to specify the authorisation rules associated with the a field on a specific type.  This directive is used in conjunction with the `authorisationStructure` settings in the `autographcraft.config.js` file.

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

On the specified model `User` there is a field called `userOnlyReadField`.  This field has been annotated with the `@fieldAuth` directive.  If you need more information on the `@modelAuth` directive, see the [Model Auth Directive Documentation](./README-DIRECTIVE-MODEL-AUTH.md).

The `@fieldAuth` directive specifies that only the `User` this model represents can read the `userOnlyReadField` field.  All other callers will receive `null` when querying this field.  Because this field is only readable by the `User` represented by the document, the field must be nullable so that the `null` value can be returned to other callers.

Adding the `@fieldAuth` directive to a field will not affect the visibility of the field in the GraphQL schema.  The field will still be visible to all callers on the GraphQL introspection query, but only the authorised callers will be able to read or write to the field.

Adding the `fieldAuth` directive to a field will remove the functionality of the `@modelAuth` directives on the type.  The `@fieldAuth` directive will take precedence over the `@modelAuth` directive.  This means that if a field has a `@fieldAuth` directive, the `@modelAuth` directives will be ignored for that field and any methods specified in the `@modelAuth` directive will not be available to the caller unless they are also specified in a `@fieldAuth` directive for the field.

<!-- TODO: CONTINUE HERE -->

<!-- 
**`type Post`**

```graphql
@fieldAuth(
  authorisingModel: "public"
  methods: [read, list]
)
```

This `@fieldAuth` directive defines that anyone who queries the application API will be able to call the `readPost` and `listPost` queries.

```graphql
@fieldAuth(
  authorisingModel: "User"
  idField: "createdByUserId"
  methods: [all]
)
```

This `@fieldAuth` directive defines that only the `User` who created the `Post` can perform any other methods on the `Post` (i.e. `createPost`, `updatePost`, `deletePost`).

**`type User`**

```graphql
@fieldAuth(
  authorisingModel: "signedIn"
  methods: [read, list]
)
```

This `@fieldAuth` directive defines that the caller must be signed into the application to be able to read a `User`'s details.

```graphql
@fieldAuth(
  authorisingModel: "User"
  idField: "id"
  methods: [read, update, delete, list]
)
```

This `@fieldAuth` directive defines that a `User` is the only caller who can edit (`update`, `delete`) their details in the database.

You will notice that there is no `create` method available on the `User` model via the `@fieldAuth` directives.  This is because it would not make sense for a user to be able create themselves.  Creation of `User`s would need to be done directly to the database via another method (such as the sign-up process). -->
