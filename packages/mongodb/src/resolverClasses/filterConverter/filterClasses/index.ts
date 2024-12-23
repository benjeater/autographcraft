import { eq } from './eq';
import { ne } from './ne';
import { lt } from './lt';
import { le } from './le';
import { gt } from './gt';
import { ge } from './ge';
import { inFilter } from './in';
import { notIn } from './notIn';
import { between } from './between';
import { startsWith } from './startsWith';
import { exists } from './exists';
import { and } from './and';
import { or } from './or';
import { not } from './not';

export { eq, and, or, not };

export { FieldFilter } from './FieldFilter';

export const classMap = {
  eq,
  ne,
  lt,
  le,
  gt,
  ge,
  in: inFilter,
  notIn,
  between,
  startsWith,
  exists,
  and,
  or,
  not,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ObjectEntries = [keyof typeof classMap, any];
