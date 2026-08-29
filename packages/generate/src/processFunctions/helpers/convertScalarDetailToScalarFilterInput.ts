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
  // GraphQL does not allow an input type with no fields, so a scalar with no
  // filters cannot produce a valid filter input. Fail here with the name of the
  // offending scalar rather than letting `parse` report a syntax error against
  // generated text the user never wrote.
  //
  // Only a user supplied scalar can reach this, and those are not collected yet
  // (see the TODO in `getPackageAndCustomScalars`); every scalar in
  // `PACKAGE_SCALARS` has filters.
  if (scalar.filtersAvailable.length === 0) {
    throw new Error(
      `The scalar "${scalar.scalarName}" has no filters available. Add at least one filter to the "filtersAvailable" list for this scalar so that a valid "${scalar.scalarName}Input" filter input type can be generated.`
    );
  }

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
