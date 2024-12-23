import { FilterClassParams, IFilterClass } from './IFilterClass';

type AllowedValues = string | number | boolean | null;

export class between implements IFilterClass {
  private valueOfFilter: [AllowedValues, AllowedValues];

  constructor(params: FilterClassParams<[AllowedValues, AllowedValues]>) {
    this.valueOfFilter = params.valueOfFilter;
  }
  convert(): Record<string, unknown> {
    return { $gte: this.valueOfFilter[0], $lte: this.valueOfFilter[1] };
  }
}
