/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  AutoGraphCraftResolverContext,
  Logger,
} from '@autographcraft/core';
import { and, or, not, classMap, FieldFilter } from './filterClasses';
import { IFilterClass } from './filterClasses/IFilterClass';

export type FilterConverterMongoDBParams = {
  context: AutoGraphCraftResolverContext;
  filter: Record<string, any> | undefined;
};

type SingleFilter = Record<keyof typeof classMap, any>;

const RECURSIVE_NODE_NAMES = ['and', 'or', 'not'];

/**
 * A class to convert filter arguments from the GraphQL list query filter into a format
 * that can be used by the database query.
 */
export class FilterConverterMongoDB {
  private context: AutoGraphCraftResolverContext;
  private logger: Logger | undefined;
  private filter: Record<string, SingleFilter>;
  constructor(params: FilterConverterMongoDBParams) {
    this.context = params.context;
    this.logger = params.context.autographcraft.logger;
    this.filter = params.filter || {};
  }

  convert(): Record<string, unknown> {
    const filterNodes: IFilterClass[] = [];

    for (const [fieldNameOrRecursiveNodeName, fieldFilter] of Object.entries(
      this.filter
    )) {
      const isRecursive = RECURSIVE_NODE_NAMES.includes(
        fieldNameOrRecursiveNodeName as string
      );

      if (!isRecursive) {
        // This is a field filter, so we can convert it directly
        const fieldFilterInstance = new FieldFilter(
          this.context,
          fieldNameOrRecursiveNodeName,
          fieldFilter
        );
        filterNodes.push(fieldFilterInstance);
        continue;
      }

      // This is a recursive node, so we need to convert it differently
      switch (fieldNameOrRecursiveNodeName) {
        case RECURSIVE_NODE_NAMES[0]: {
          const params = {
            context: this.context,
            valueOfFilter: fieldFilter as unknown as SingleFilter[],
          };
          const andInstance = new and(params);
          filterNodes.push(andInstance);
          break;
        }
        case RECURSIVE_NODE_NAMES[1]: {
          const params = {
            context: this.context,
            valueOfFilter: fieldFilter as unknown as SingleFilter[],
          };
          const orInstance = new or(params);
          filterNodes.push(orInstance);
          break;
        }
        case RECURSIVE_NODE_NAMES[2]: {
          const params = {
            context: this.context,
            valueOfFilter: fieldFilter,
          };
          const notInstance = new not(params);
          filterNodes.push(notInstance);
          break;
        }
        default:
          this.logger?.warn(
            `Unknown recursive node name: ${fieldNameOrRecursiveNodeName}`
          );
      }
    }

    const returnFilter = filterNodes.reduce((acc, filterClass) => {
      const convertedFilter = filterClass.convert();
      return { ...acc, ...convertedFilter };
    }, {});

    return returnFilter;
  }
}
