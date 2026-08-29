import type { ProcessFunctionParams } from '../types';

/**
 * Builds a `ProcessFunctionParams` for a test.
 *
 * `ProcessFunctionParams` intersects a `Record<string, string | number |
 * boolean>` index signature with `_: string[]`, so `_` conflicts with the
 * index signature and no object literal can satisfy the type directly. The
 * source has the same problem and casts in `getParams`, so the tests funnel
 * their params through this helper rather than repeating the cast.
 *
 * @param argv the positional arguments, as yargs would populate `_`
 * @param flags any named flags yargs would have parsed alongside them
 */
export function buildParams(
  argv: string[],
  flags: Record<string, string | number | boolean> = {}
): ProcessFunctionParams {
  return { ...flags, _: argv } as ProcessFunctionParams;
}
