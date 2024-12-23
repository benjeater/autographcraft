/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AutoGraphCraftResolverContext } from '@autographcraft/core';

export interface IFilterClass {
  convert(): Record<string, unknown>;
}

export type FilterClassParams<T> = {
  context: AutoGraphCraftResolverContext;
  valueOfFilter: T;
};
