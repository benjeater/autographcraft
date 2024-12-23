# AutoGraphCraft - Configuration Settings

- [AutoGraphCraft - Configuration Settings](#autographcraft---configuration-settings)
  - [Configuration Setting Description](#configuration-setting-description)
  - [Set command](#set-command)
  - [SetToDefault command](#settodefault-command)
  - [Configuration Setting Details](#configuration-setting-details)
    - [Authorisation Structure](#authorisation-structure)
    - [Multi-Entry Point Authorisation Structure](#multi-entry-point-authorisation-structure)

AutoGraphCraft uses the `autographcraft.config.js` at the root of your project to configure the generation process. These configuration settings can be changed in the `autographcraft.config.js` file, but we recommend using the configuration set command to change values because this will also update the `.gitignore` file where appropriate.

## Configuration Setting Description

- `schemaSourceDirectory` - The directory containing the GraphQL schema files that will be used as the basis for the generated output.
- `generatedModelsDirectory` - The directory where all the generated resolvers and associated files will be placed after being generated.
- `generatedTypesDirectory` - The directory where all the generated types will be placed after being generated.
- `generatedDatabaseDirectory` - The directory where all the generated database connection logic will be placed after being generated.
- `generatedUtilsDirectory` - The directory where all the generated utility functions will be placed after being generated.
- `gitIgnorePath` - The path to the `.gitignore` file for the project.
- `databaseType` - The database type to generate the database schemas and connection for.
- `authorisationStructure` - The authorisation structure used in the GraphQL schemas to specify the data used for API authorisation.

## Set command

Use the following command to set a value in the configuration file.

```sh
npx autographcraft config set <KEY> <VALUE>
```

For instance, if you wanted to change the value of the `generatedTypesDirectory` configuration setting, you would run the command:

```sh
npx autographcraft config set generatedTypesDirectory 'src/newDirectory`
```

This would update the configuration file and would change the value in the `.gitignore` file from the previous value to the new value. This might cause files that were previously ignored by `.gitignore` to become part of `git` changes, but the previous target directory can be deleted without issue.

Please remember to run the generation process again after changing the configuration to apply the new settings to the generated output.

## SetToDefault command

Use the following command to set a value in the configuration file to the default value. You will be asked to confirm the change before it is committed.

```sh
npx autographcraft config setToDefault <KEY>
```

For instance, if you wanted to change the value of the `generatedTypesDirectory` configuration setting, you would run the command:

```sh
npx autographcraft config setToDefault generatedTypesDirectory
```

## Configuration Setting Details

### Authorisation Structure

The `authorisationStructure` configuration setting is used to specify the structure of the authorisation data used in the GraphQL schemas. This is used to generate the authorisation logic in the generated resolvers.

The `authorisationStructure` setting is an array of objects.  Each object represents the "entry point" for the fetching of authorisation data.  The below example shows an `authorisationStructure` array for an application which only requires a `User`'s ID for authorisation purposes.

```json
"authorisationStructure": [
  {
    "targetModelName": "User",
  }
]
```

The `targetModelName` property is the name of the model that the authorisation data is being fetched for.  The `targetModelName` property is required.  When initialising the `authgraphcraft` context, the `authInitialisationData` object should be passed in with the `targetModelName` as a key.  The value of the key should be the ID of the `User`. For instance:

```json
{
  "User": "1234"
}
```

Each object in the `authorisationStructure` array can also have `joins` property which defines how the "entry point" is related to other models.  The `joins` property is an array of objects.  Each object in the `joins` array represents a relationship between the "entry point" and another model.  The below example shows an `authorisationStructure` array for an application which requires a `User`'s ID, the `Employee` records of the `User`, and the `Organisation` that the `Employee` is associated with (i.e. multi-tenant system where `User`s can be part of many `Organisation`s).

```json
"authorisationStructure": [
  {
    "targetModelName": "User",
    "joins": [
      {
        "sourceJoinType": "hasMany",
        "sourceIdFieldName": "id",
        "targetModelName": "Employee",
        "targetModelIdFieldName": "userId",
        "joins": [
          {
            "sourceJoinType": "hasOne",
            "sourceIdFieldName": "organisationId",
            "targetModelName": "Organisation",
            "targetModelIdFieldName": "id"
          }
        ]
      }
    ]
  }
]
```

Using the above `authorisationStructure`, the `User`, `Employee`, and `Organisation` models can all be used in the `@modelAuth` directives as the `authorisingModel` parameter value.

### Multi-Entry Point Authorisation Structure

In a multi-tenant application, you may want users to only be able to access a single tenant at a time, which would not be possible with a single entry point in the `authorisationStructure` array.  In this case, you can have multiple entry points in the `authorisationStructure` array.  The below example shows an `authorisationStructure` array for an application which has an entry point for the `User`, and another for the `Organisation` that the `User` is currently logged into.

```json
"authorisationStructure": [
  {
    "targetModelName": "User",
  },
  {
    "targetModelName": "Organisation",
  }
]
```

The `authInitialisationData` object passed to the context of the server will now need to include an ID for the `User` and the `Organisation`. For instance:

```json
{
  "User": "1234",
  "Organisation": "5678"
}
```
