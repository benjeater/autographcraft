import type {
  AutoGraphCraftResolverContext,
  ExtendedResolverType,
} from '@autographcraft/core';
import { HookInNames } from '@autographcraft/core';

export type HookInFunction = (
  parent: unknown,
  args: unknown,
  context: AutoGraphCraftResolverContext,
  info: unknown,
  document: unknown
) => Promise<void>;

export type HookInFile = {
  filename: string;
  resolverName: ExtendedResolverType;
  hookPoint: HookInNames;
  orderNumber: number;
  defaultFunction: HookInFunction;
};
