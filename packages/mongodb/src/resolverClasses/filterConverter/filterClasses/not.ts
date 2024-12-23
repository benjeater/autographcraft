import { FilterConverterMongoDB } from '../FilterConverterMongoDB';
import { FilterClassParams, IFilterClass } from './IFilterClass';

type AllowedValues = Record<string, unknown>;
export class not implements IFilterClass {
  public valueOfFilter: Record<string, unknown>;
  private topLevelFilterInstance: FilterConverterMongoDB;

  constructor(params: FilterClassParams<AllowedValues>) {
    this.valueOfFilter = params.valueOfFilter;
    this.topLevelFilterInstance = new FilterConverterMongoDB({
      context: params.context,
      filter: this.valueOfFilter,
    });
  }

  convert(): Record<string, unknown> {
    return {
      $not: this.topLevelFilterInstance.convert(),
    };
  }
}
