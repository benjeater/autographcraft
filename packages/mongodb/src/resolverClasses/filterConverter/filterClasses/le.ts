import { FilterClassParams, IFilterClass } from './IFilterClass';

type AllowedValues = string | number | boolean | null;

export class le implements IFilterClass {
  private valueOfFilter: AllowedValues;

  constructor(params: FilterClassParams<AllowedValues>) {
    this.valueOfFilter = params.valueOfFilter;
  }
  convert(): Record<string, unknown> {
    return { $lte: this.valueOfFilter };
  }
}
