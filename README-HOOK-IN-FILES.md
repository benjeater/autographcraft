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
| preValidateDocument            | ✔      | ✔    | ✔      |        | ✔    |
| postValidateDocument           | ✔      | ✔    | ✔      |        | ✔    |
| preCommit                      | ✔      |      | ✔      | ✔      |      |
| postCommit                     | ✔      |      | ✔      | ✔      |      |
| final                          | ✔      | ✔    | ✔      | ✔      | ✔    |
| error                          | ✔      | ✔    | ✔      | ✔      | ✔    |

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
