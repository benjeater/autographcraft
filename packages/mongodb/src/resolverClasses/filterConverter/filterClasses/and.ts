import { FilterConverterMongoDB } from '../FilterConverterMongoDB';
import { FilterClassParams, IFilterClass } from './IFilterClass';

type AllowedValues = Record<string, unknown>[];

export class and implements IFilterClass {
  private valueOfFilter: Record<string, unknown>[];
  private topLevelFilterInstances: FilterConverterMongoDB[];

  constructor(params: FilterClassParams<AllowedValues>) {
    this.valueOfFilter = params.valueOfFilter;
    this.topLevelFilterInstances = this.valueOfFilter.map(
      (filter) =>
        new FilterConverterMongoDB({ context: params.context, filter })
    );
  }

  convert(): Record<string, unknown> {
    return {
      $and: this.topLevelFilterInstances.map((filterInstance) =>
        filterInstance.convert()
      ),
    };
  }
}
