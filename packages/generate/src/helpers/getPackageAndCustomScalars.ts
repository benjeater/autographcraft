import { PACKAGE_SCALARS } from '@autographcraft/core';
import type { ScalarDetail } from '@autographcraft/core';

export function getPackageAndCustomScalars(): Record<string, string> {
  const scalarsToMap: ScalarDetail[] = [
    ...PACKAGE_SCALARS,
    // TODO: custom scalars. The filter input path is ready for these -
    // `convertScalarDetailToScalarFilterInput` already rejects a scalar with an
    // empty `filtersAvailable` by name - but nothing reaches it until user
    // supplied scalars are actually collected and spread in here.
    // ...customScalars,
  ];

  const scalars: Record<string, string> = scalarsToMap.reduce(
    (acc, scalar) => {
      acc[scalar.scalarName] = scalar.javascriptType;
      return acc;
    },
    {} as Record<string, string>
  );
  return scalars;
}
