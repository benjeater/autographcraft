# `@modelAuth` Directive Documentation

- [`@modelAuth` Directive Documentation](#modelauth-directive-documentation)
  - [Directive Specification](#directive-specification)
  - [Setting up Authorising Models](#setting-up-authorising-models)
  - [Usage](#usage)
  - [Special Authorising Models](#special-authorising-models)

The `@modelAuth` directive is used to specify the authorisation rules associated with the type.  This directive is used in conjunction with the `authorisationStructure` settings in the `autographcraft.config.js` file.

This documentation is created for the purpose of explaining the functionality of the `@modelAuth` directive and should not be considered a guide on best practice for authorisation within your application.

## Directive Specification

The full directive is specified as:

```graphql
directive @modelAuth(authorisingModel: String!, idField: String, methods: [AUTH_METHOD!]!) on OBJECT

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

The `@modelAuth` directive is used to specify that the type should only be accessible to some API callers, and which resolvers those callers have access to.  The schema below defines a simple application and will be used for this documentation.

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
}

type Post 
  @model 
  @modelAuth(
    authorisingModel: "public"
    methods: [read, list]
  ) 
  @modelAuth(
    authorisingModel: "User"
    idField: "createdByUserId"
    methods: [all]
  ) {
  id: ID!
  createdByUserId: ID! @index(name: "byCreatedByUserId")
  user: User @hasOne(idField: "createdByUserId")
  title: String!
  content: String!
}
```

There are two specified models, `User` and `Posts`.  Both models have been annotated with two `@modelAuth` directives.

**`type Post`**

```graphql
@modelAuth(
  authorisingModel: "public"
  methods: [read, list]
)
```

This `@modelAuth` directive defines that anyone who queries the application API will be able to call the `readPost` and `listPost` queries.

```graphql
@modelAuth(
  authorisingModel: "User"
  idField: "createdByUserId"
  methods: [all]
)
```

This `@modelAuth` directive defines that only the `User` who created the `Post` can perform any other methods on the `Post` (i.e. `createPost`, `updatePost`, `deletePost`).

**`type User`**

```graphql
@modelAuth(
  authorisingModel: "signedIn"
  methods: [read, list]
)
```

This `@modelAuth` directive defines that the caller must be signed into the application to be able to read a `User`'s details.

```graphql
@modelAuth(
  authorisingModel: "User"
  idField: "id"
  methods: [read, update, delete, list]
)
```

This `@modelAuth` directive defines that a `User` is the only caller who can edit (`update`, `delete`) their details in the database.

You will notice that there is no `create` method available on the `User` model via the `@modelAuth` directives.  This is because it would not make sense for a user to be able create themselves.  Creation of `User`s would need to be done directly to the database via another method (such as the sign-up process).

## Special Authorising Models

There are three (3) special authorising models that can be used with the `@modelAuth` directive:

- `public`: This authorising model allows anyone to access the model.
- `signedIn`: This authorising model allows signed-in users to access the model.
- `admin`: This authorising model allows users with the `isAdmin` flag set to `true` on the context object to access the model.

You cannot use these model names as the name of a model in the `autographcraft.config.js` file or as the name of a type in the schema.

These special authorising models can be used in the `authorisingModel` parameter of the `@modelAuth` directive and must be done so without the `idField` parameter.

```graphql
@modelAuth(
  authorisingModel: "public"
  methods: [read, list]
)

@modelAuth(
  authorisingModel: "signedIn"
  methods: [read, list]
)

@modelAuth(
  authorisingModel: "admin"
  methods: [all]
)
```
