import cloneDeep from 'lodash.clonedeep';

export type TestDocument = {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  passwordHash: string;
};

const standardDocument: TestDocument = {
  _id: '65d1f1c1c1c1c1c1c1c1c1c1',
  id: '65d1f1c1c1c1c1c1c1c1c1c1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  emailAddress: 'ada@example.com',
  passwordHash: 'a-very-secret-hash',
};

/**
 * A fresh document for every test; the unit under test edits the document it is
 * given, so a shared instance would leak between tests.
 */
export function getStandardDocument(): TestDocument {
  return cloneDeep(standardDocument);
}
