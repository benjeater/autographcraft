import cloneDeep from 'lodash.cloneDeep';

const FIELDS_ALWAYS_PERMITTED = ['_id', 'id'];

/**
 * Removes all fields from a document that are not in the permittedFields set
 * @param document The document to remove fields from
 * @param permittedFields The set of field names that are permitted
 * @returns a copy of the document with all unauthorised fields removed
 */
export function removeUnauthorisedFieldsFromDocument<ReturnType>(
  document: ReturnType,
  permittedFields: Set<string>
): ReturnType {
  if (!document) {
    return document;
  }
  const documentCopy = cloneDeep(document);
  for (const fieldName of Object.keys(documentCopy)) {
    if (FIELDS_ALWAYS_PERMITTED.includes(fieldName)) {
      continue;
    }
    if (!permittedFields.has(fieldName)) {
      delete (document as Record<string, unknown>)[fieldName];
    }
  }
  return document;
}
