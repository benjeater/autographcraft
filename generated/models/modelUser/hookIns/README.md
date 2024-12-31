# Hook-In File Directory

**AutoGraphCraft: Generated with version 1.2.0**

The files within this folder are read by the model's resolver process and are used to add functionality to the model's resolver process.

The files are read at specific points in the process based on their name. More detail on each of these hook points can be found in the READMEs for the AutoGraphCraft project.

Below is the template for a hook-in file in this directory:

```typescript
import type { AutoGraphCraftResolverContext } from '@autographcraft/core';
import type { QueryReadUserArgs, User } from '../../../generatedTypes/typescriptTypes';

async function defaultFunction(
  parent: unknown,
  args: QueryReadUserArgs,
  context: AutoGraphCraftResolverContext,
  info: unknown,
  documents: User[] | null
): Promise<void> {
  // Implement your hook-in function here
}

export default defaultFunction;
```
