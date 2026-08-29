/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AutoGraphCraftResolverContext } from '@autographcraft/core';
import { and, or, not, classMap, FieldFilter } from './filterClasses';
import { FilterClassParams, IFilterClass } from './filterClasses/IFilterClass';

export type FilterConverterMongoDBParams = {
  context: AutoGraphCraftResolverContext;
  filter: Record<string, any> | undefined;
};

type SingleFilter = Record<keyof typeof classMap, any>;

const RECURSIVE_NODE_NAMES = ['and', 'or', 'not'] as const;

type RecursiveNodeName = (typeof RECURSIVE_NODE_NAMES)[number];

/**
 * The filter class that handles each recursive node.
 *
 * Keying this by the union rather than switching on the node name makes it
 * exhaustive by construction: adding a name to `RECURSIVE_NODE_NAMES` is a
 * compile error until it has an entry here. The `switch` this replaced needed a
 * `default` arm that no input could ever reach, because its cases were the
 * whole of the array that the guard above had already tested membership of.
 */
const RECURSIVE_NODE_CLASSES: Record<
  RecursiveNodeName,
  new (params: FilterClassParams<any>) => IFilterClass
> = { and, or, not };

function isRecursiveNodeName(value: string): value is RecursiveNodeName {
  return (RECURSIVE_NODE_NAMES as readonly string[]).includes(value);
}

/**
 * A class to convert filter arguments from the GraphQL list query filter into a format
 * that can be used by the database query.
 */
export class FilterConverterMongoDB {
  private context: AutoGraphCraftResolverContext;
  private filter: Record<string, SingleFilter>;
  constructor(params: FilterConverterMongoDBParams) {
    this.context = params.context;
    this.filter = params.filter || {};
  }

  convert(): Record<string, unknown> {
    const filterNodes: IFilterClass[] = [];

    for (const [fieldNameOrRecursiveNodeName, fieldFilter] of Object.entries(
      this.filter
    )) {
      if (!isRecursiveNodeName(fieldNameOrRecursiveNodeName)) {
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
      const RecursiveNodeClass =
        RECURSIVE_NODE_CLASSES[fieldNameOrRecursiveNodeName];
      filterNodes.push(
        new RecursiveNodeClass({
          context: this.context,
          valueOfFilter: fieldFilter,
        })
      );
    }

    const returnFilter = filterNodes.reduce((acc, filterClass) => {
      const convertedFilter = filterClass.convert();
      return { ...acc, ...convertedFilter };
    }, {});

    return returnFilter;
  }
}
