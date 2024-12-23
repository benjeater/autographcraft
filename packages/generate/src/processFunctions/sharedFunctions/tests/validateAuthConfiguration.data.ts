import { cloneDeep } from 'lodash';
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
