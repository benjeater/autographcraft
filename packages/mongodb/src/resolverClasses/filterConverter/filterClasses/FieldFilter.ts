/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AutoGraphCraftResolverContext } from '@autographcraft/core';
import { classMap, type ObjectEntries } from './index';
import { IFilterClass } from './IFilterClass';

/**
 * Builds the filter object for a specific field.
 */
export class FieldFilter implements IFilterClass {
  private context: AutoGraphCraftResolverContext;
  public fieldName: string;
  public filterObject: Record<string, any>;
  private filterClasses: IFilterClass[];

  constructor(
    context: AutoGraphCraftResolverContext,
    fieldName: string,
    filterObject: Record<string, any> | undefined
  ) {
    this.context = context;
    this.fieldName = fieldName;
    this.filterObject = filterObject || {};
    this.filterClasses = this.convertFilterObjectToFilterClasses();

    if (this.fieldName === 'id') {
      this.fieldName = '_id';
    }
  }

  private convertFilterObjectToFilterClasses(): IFilterClass[] {
    const filterClasses: IFilterClass[] = [];
    for (const [filterOperator, filterValue] of Object.entries(
      this.filterObject
    ) as ObjectEntries[]) {
      const filterClass = classMap[filterOperator];
      if (!filterClass) {
        throw new Error(
          `No filter class found for filter operator: ${filterOperator} on field: ${this.fieldName}`
        );
      }
      const params = { context: this.context, valueOfFilter: filterValue };
      const filterClassInstance = new filterClass(params);
      filterClasses.push(filterClassInstance);
    }
    return filterClasses;
  }

  convert(): Record<string, any> {
    const returnFilter = this.filterClasses.reduce((acc, filterClass) => {
      const convertedFilter = filterClass.convert();
      return { ...acc, ...convertedFilter };
    }, {});

    return { [this.fieldName]: returnFilter };
  }
}
