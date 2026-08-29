# Hook-In File Directory

Hook-in Files are read by the model's resolver process and are used to add logic specific to your project to the model's resolver process.

The files are read at specific points in the process based on their name.

During the generation of a new model, a `README` file will be added to the `hookIns` directory that will provide a brief overview of the hook-in files and how they are used, including an example hook-in file for the particular model which the `README` file is associated with.

## File Naming Convention

All files within this folder must be named in the following format:

`<resolverName>-<hookPoint>-<orderNumber>.<fileExtension>`

Where:

- `<resolverName>` is the name of the resolver that the file is used for. Further detail on the resolver name can be found below.
- `<hookPoint>` is the name of the place in the process where the file is read. Further detail on the hook points can be found below.
- `<orderNumber>` is the order in which the file is read. Files are read in ascending order based on this number for each hook point.
- `<fileExtension>` is the file extension of the file.

**Example**: if you wanted to use a hook-in file for the `read` query as a post-fetch check, you would name the file as follows:

`read-postFetch-1.ts`

**Example**: if you wanted to use a hook-in file for all the `mutations` as a validation, you would name the file as follows:

`mutations-validate-1.ts`

**Example**: if you wanted to use a hook-in file for all the resolvers as a pre-fetch check, you would name the file as follows:

`all-preFetch-1.ts`

### Resolver Names

The following are the names of the resolvers that are currently supported:

- `create`
- `read`
- `update`
- `delete`
- `list`

These are also grouped into the following categories:

- `queries`
- `mutations`
- `all`

If there are multiple files for the same hook point, they will be read in the following order, then in ascending order based on the order number:

- resolver name (i.e. `create`, `read`, `update`, `delete`, `list`)
- resolver type (i.e. `queries`, `mutations`
- `all`

**Example**: if you had the following files:

- `create-preFetch-1.ts`
- `create-preFetch-2.ts`
- `queries-preFetch-1.ts`
- `queries-preFetch-2.ts`
- `mutations-preFetch-1.ts`
- `all-preFetch-1.ts`

The `create` resolver would read the files in the following order:

- `create-preFetch-1.ts`
- `create-preFetch-2.ts`
- `mutations-preFetch-1.ts`
- `all-preFetch-1.ts`

Whereas the `read` resolver would read the files in the following order:

- `queries-preFetch-1.ts`
- `queries-preFetch-2.ts`
- `all-preFetch-1.ts`

**NOTE**  
The order numbers do not need to be sequential. They can be any number as long as they are unique for the `<resolverName>`-`<hookPoint>` pairing.

### Hook Points

The following are the hook points that are currently supported:

- `initial`
- `preValidateArgs`
- `postValidateArgs`
- `preArchitecturalAuthorize`
- `postArchitecturalAuthorize`
- `preFetch`
- `postFetch`
- `preDocumentAuthorize`
- `postDocumentAuthorize`
- `preValidateDocument`
- `postValidateDocument`
- `preCommit`
- `postCommit`
- `final`
- `error`

Each hook point brackets a specific step of the resolver process. The sections
below describe where each hook point sits in the generated logic, what the
`documents` argument holds at that point, and what the hook point is typically
used for.

**NOTE:**  
The steps described below are carried out by the resolver classes that the
generated resolvers delegate to. All the hook-in files for a hook point are run
in series, in the order described above, and each one is awaited before the next
is called.

#### `initial`

Runs first, before any other step of the resolver process. Nothing has been
validated, authorised or fetched at this point, so `documents` is `null`.

For the `list` resolver only, one step happens before `initial`: if `args.filter`
does not already mention `deletedAt`, a `deletedAt: { eq: null }` clause is added
to it so that soft-deleted documents are excluded from the results. An `initial`
hook-in file is therefore the first opportunity to change that behaviour.

Typically used for request-level setup, logging and metrics.

#### `preValidateArgs` and `postValidateArgs`

These bracket the built-in validation of the resolver arguments:

- `read` and `delete` check that `args.id` is a valid database id,
- `update` checks that `args.input.id` is a valid database id,
- `create` and `list` have no built-in argument validation, so for those two
  resolvers the two hook points run one immediately after the other.

An invalid id throws, so `postValidateArgs` is only reached when the arguments
passed the check. `documents` is `null` at both hook points.

Typically used to apply your own argument validation, or to normalise and default
values on `args` before the rest of the process reads them.

**NOTE:**  
For the `create` resolver, `args.input` has already been stripped of any fields
the caller is not permitted to write by the time `preValidateArgs` runs; that
stripping happens between `initial` and `preValidateArgs`.

#### `preArchitecturalAuthorize` and `postArchitecturalAuthorize`

These bracket the call to `architecturalAuthorisation` in the model's
`auths/<resolverName>` file. That is the caller-level check, which asks whether
this caller is permitted to call this resolver on this model at all, based on the
`@modelAuth` directives on the type. It does not look at any document.

A failed check throws, so `postArchitecturalAuthorize` is only reached when the
caller passed. `documents` is `null` at both hook points.

Typically used for authorisation logging, or to apply a coarse-grained check of
your own alongside the generated one.

#### `preFetch` and `postFetch`

These bracket the read from the database, and so do not exist for the `create`
resolver, which has nothing to fetch:

- `read` fetches the document by id,
- `update` and `delete` fetch the document by id, excluding documents that have
  already been soft-deleted,
- `list` builds the database query by combining the filter derived from `args`
  with the authorisation filter returned by `getListFilter` in the model's
  `auths/list` file, then runs it with the requested paging and sort options.

For `read`, `update` and `delete`, a document that does not exist, or that has
already been deleted, throws, so `postFetch` is only reached when a document was
found.

`documents` is `null` at `preFetch`. At `postFetch` it is the fetched document
wrapped in an array for `read`, `update` and `delete`, and the page of fetched
documents for `list`.

Typically used to adjust `args` immediately before the query is built, or to
inspect the stored document before any authorisation decision has been made
against it.

**NOTE:**  
The documents provided at `postFetch` are database documents, not the plain
objects that the resolver eventually returns.

#### `preDocumentAuthorize` and `postDocumentAuthorize`

These bracket the call to `documentAuthorisation` in the model's
`auths/<resolverName>` file. That is the per-document check, which asks whether
this caller is permitted to act on this particular document.

What the check is run against differs by resolver:

- `create` and `update` run it against `args.input`,
- `read` and `delete` run it against the document fetched from the database,
- `list` does not run a per-document check here at all, because authorisation for
  a list is applied as part of the database query by `getListFilter`, and then
  field by field as the results are built. For `list` the two hook points
  therefore run one immediately after the other.

A failed check throws, so `postDocumentAuthorize` is only reached when the caller
passed. `documents` is `null` for `create`, the fetched document wrapped in an
array for `read`, `update` and `delete`, and the fetched page for `list`.

Typically used for authorisation logging, or to apply your own per-document rules
in addition to the generated ones.

**NOTE:**  
For the `update` resolver, `args.input` is stripped of any fields the caller is
not permitted to write and then merged into the fetched document immediately
after `postDocumentAuthorize` has run.

#### `preValidateDocument` and `postValidateDocument`

These bracket the database schema validation of the document being written.
`documents` is the document that is about to be validated, wrapped in an array.

A validation failure throws, so `postValidateDocument` is only reached when the
document is valid.

Typically used to populate or correct fields on the document before it is checked
against the database schema.

The `create` and `update` resolvers run these hook points. `create` validates the
new document, and `update` validates the document that the input was merged into,
in both cases before the write is attempted.

**NOTE:**  
The `update` resolver only runs these hook points in releases of the resolver
classes after `1.5.0`. On `1.5.0` and earlier, only `create` runs them, and an
`update-preValidateDocument-*` or `update-postValidateDocument-*` hook-in file is
silently never called.

The `delete` resolver does not run them, because a delete is a soft delete that
writes only a `deletedAt` timestamp. The `read` and `list` resolvers never write
a document, so there is nothing for the pair to bracket.

#### `preCommit` and `postCommit`

These bracket the write to the database, and so do not exist for the `read` and
`list` resolvers, which do not write:

- `create` saves the new document,
- `update` saves the document that the input was merged into,
- `delete` performs a soft delete, setting `deletedAt` to the current time rather
  than removing the document.

At `preCommit`, `documents` is the document as it is about to be written, wrapped
in an array: the unsaved new document for `create`, the merged document for
`update`, and the document as it stands before deletion for `delete`. At
`postCommit`, `documents` is the written document, as a plain object, wrapped in
an array.

`preCommit` is the last point at which a change to the document will be
persisted. `postCommit` is the usual place for side effects that should only
happen once the write has succeeded, such as emitting an event or invalidating a
cache.

**NOTE:**  
The document provided at `postCommit` has not yet had the fields the caller is
not permitted to read removed from it, so it is the complete stored document.

#### `final`

Runs last on the successful path, after the fields that the caller is not
permitted to read have been removed, and immediately before the resolver returns.

`documents` is the document that is about to be returned, wrapped in an array,
for `create`, `update` and `delete`, and the array of result documents for
`list`. For `list` this is the `results` array only; the `nextToken` is added to
the response after the hook point has run.

Typically used for logging, metrics and auditing of successful calls.

**NOTE:**  
The `read` resolver provides the database document to `final` rather than the
field-filtered plain object that it returns. Do not rely on the documents
provided at `final` matching exactly what the caller will receive.

#### `error`

Runs when an error is thrown at any point in the resolver process, including an
error thrown by one of your own hook-in files. The error is logged, the `error`
hook-in files are run, and the error is then returned to the client.

`documents` is whatever had been fetched or written by the time the error was
thrown, wrapped in an array, or `null` if nothing had been.

Typically used for error logging, alerting and cleanup.

**NOTE:**  
An error thrown by an `error` hook-in file is not caught, and will replace the
original error. `error` is also the only hook point that can run after the
process has already failed, so an `error` hook-in file must not assume that any
earlier step completed.

### Hook Point Availability

Not all hook points are available for all resolvers. The following is a table of which hook points are available for each resolver:

| Hook Point                     | Create | Read | Update | Delete | List |
|--------------------------------|--------|------|--------|--------|------|
| initial                        | ✔      | ✔    | ✔      | ✔      | ✔    |
| preValidateArgs                | ✔      | ✔    | ✔      | ✔      | ✔    |
| postValidateArgs               | ✔      | ✔    | ✔      | ✔      | ✔    |
| preArchitecturalAuthorize      | ✔      | ✔    | ✔      | ✔      | ✔    |
| postArchitecturalAuthorize     | ✔      | ✔    | ✔      | ✔      | ✔    |
| preFetch                       |        | ✔    | ✔      | ✔      | ✔    |
| postFetch                      |        | ✔    | ✔      | ✔      | ✔    |
| preDocumentAuthorize           | ✔      | ✔    | ✔      | ✔      | ✔    |
| postDocumentAuthorize          | ✔      | ✔    | ✔      | ✔      | ✔    |
| preValidateDocument            | ✔      |      | ✔      |        |      |
| postValidateDocument           | ✔      |      | ✔      |        |      |
| preCommit                      | ✔      |      | ✔      | ✔      |      |
| postCommit                     | ✔      |      | ✔      | ✔      |      |
| final                          | ✔      | ✔    | ✔      | ✔      | ✔    |
| error                          | ✔      | ✔    | ✔      | ✔      | ✔    |

**NOTE:**  
The `update` resolver only runs `preValidateDocument` and `postValidateDocument`
in releases of the resolver classes after `1.5.0`. On `1.5.0` and earlier, an
`update-preValidateDocument-*` or `update-postValidateDocument-*` hook-in file
is silently never called; check the version you have installed before relying on
them.

**NOTE:**  
A `pre`/`post` pair being available for a resolver does not always mean that a
step is carried out between the two. The `create` and `list` resolvers have no
built-in argument validation between `preValidateArgs` and `postValidateArgs`,
and the `list` resolver performs no per-document authorisation between
`preDocumentAuthorize` and `postDocumentAuthorize`. In those cases the hook
points still run, one immediately after the other. See the descriptions above
for the detail.

## File Content

The file must export the hook function as the default export.

The content of the file will depend on the hook point that the file is being used for. The content of the file should be a function that takes the following parameters based on the hook point:

**NOTE:**  
Errors within the hook-in files will stop the resolver process and return the error to the client.  If you wish to log an error and continue processing, you must catch the error within the hook-in file.

**NOTE:**  
The arguments provided to the hook in functions are references and therefore any changes made to the arguments will be reflected in the subsequent hooks and the resolver process.

The following is a list of the parameters that are passed all hook functions:

- `parent` - the parent object for the resolver,
- `args` - the arguments for the resolver,
- `context` - the context object for the resolver,
- `info` - the info object for the resolver,
- `documents` - an array of the documents that are being processed by the resolver.

**NOTE:**  
The `documents` argument is always provided as an array so that the `list` resolver has the same arguments as the other resolvers that only handle a single document.  For the non-list resolvers, the `documents` argument will either be `null`, or will be an array containing a single document.
