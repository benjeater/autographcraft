import { PACKAGE_SCALARS } from '@autographcraft/core';
import type { ScalarDetail } from '@autographcraft/core';

export function getPackageAndCustomScalars(): Record<string, string> {
  const scalarsToMap: ScalarDetail[] = [
    ...PACKAGE_SCALARS,
    // ...customScalars, // TODO: custom scalars
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
