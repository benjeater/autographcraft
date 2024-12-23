import type { DocumentNode } from 'graphql';
import { PossibleFilters, type ScalarDetail } from '@autographcraft/core';
import { convertSchemaToDocumentTypeDef } from './convertSchemaToDocumentTypeDef';

const LIST_FILTERS = [
  PossibleFilters.in,
  PossibleFilters.notIn,
  PossibleFilters.between,
];

export function convertScalarDetailToScalarFilterInput(
  scalar: ScalarDetail
): DocumentNode {
  const inputName: string = `${scalar.scalarName}Input {`;

  const scalarStringLines: string[] = [`input ${inputName}`];

  for (const scalarFilterAvailable of scalar.filtersAvailable) {
    if (scalarFilterAvailable === PossibleFilters.exists) {
      scalarStringLines.push(`  ${scalarFilterAvailable}: Boolean`);
      continue;
    }

    const isList = LIST_FILTERS.includes(scalarFilterAvailable);
    if (isList) {
      scalarStringLines.push(
        `  ${scalarFilterAvailable}: [${scalar.scalarName}!]`
      );
      continue;
    }
    scalarStringLines.push(`  ${scalarFilterAvailable}: ${scalar.scalarName}`);
  }

  scalarStringLines.push('}');

  const scalarString = scalarStringLines.join('\n');
  const typeDef = convertSchemaToDocumentTypeDef(scalarString);
  return typeDef;
}
