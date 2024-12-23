import { FilterClassParams, IFilterClass } from './IFilterClass';

type AllowedValues = boolean | null;

export class exists implements IFilterClass {
  private valueOfFilter: AllowedValues;

  constructor(params: FilterClassParams<AllowedValues>) {
    this.valueOfFilter = params.valueOfFilter;
  }
  convert(): Record<string, unknown> {
    return { $exists: this.valueOfFilter };
  }
}
