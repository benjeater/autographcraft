import cloneDeep from 'lodash.clonedeep';
import type { RootModelAuthorisationDetail } from '@autographcraft/core';

const existingConfiguration: RootModelAuthorisationDetail[] = [
  {
    targetModelName: 'User',
    joins: [
      {
        sourceJoinType: 'hasMany',
        sourceIdFieldName: 'id',
        targetModelName: 'Employee',
        targetModelIdFieldName: 'userId',
      },
    ],
  },
  {
    targetModelName: 'Company',
    joins: [],
  },
];

export function getExistingConfiguration() {
  return cloneDeep(existingConfiguration);
}

// A root model with no `joins` key at all, which is the only way to reach the
// early return in `recursivelyExtractModelNames`.
const configurationWithoutJoins: RootModelAuthorisationDetail[] = [
  {
    targetModelName: 'User',
  },
  {
    targetModelName: 'Company',
  },
];

// Joins nested two levels deep, so the extraction has to recurse.
const nestedConfiguration: RootModelAuthorisationDetail[] = [
  {
    targetModelName: 'User',
    joins: [
      {
        sourceJoinType: 'hasMany',
        sourceIdFieldName: 'id',
        targetModelName: 'Employee',
        targetModelIdFieldName: 'userId',
        joins: [
          {
            sourceJoinType: 'hasMany',
            sourceIdFieldName: 'id',
            targetModelName: 'Timesheet',
            targetModelIdFieldName: 'employeeId',
          },
        ],
      },
    ],
  },
];

export function getConfigurationWithoutJoins() {
  return cloneDeep(configurationWithoutJoins);
}

export function getNestedConfiguration() {
  return cloneDeep(nestedConfiguration);
}
