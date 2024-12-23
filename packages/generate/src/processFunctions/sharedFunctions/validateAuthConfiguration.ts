import type {
  ModelJoinAuthorisationDetail,
  RootModelAuthorisationDetail,
} from '@autographcraft/core';
import { logger } from '@autographcraft/core';

/**
 * Ensures that the authorisation configuration provided by the caller is valid.
 * @param existingConfig The existing configuration object
 */
export function validateAuthConfiguration(
  authorisationStructure: RootModelAuthorisationDetail[] = []
): void {
  const modelNames: string[] = [];

  // Check if the authorisation structure is empty
  if (!authorisationStructure || authorisationStructure.length === 0) {
    logger.warn(
      '⚠️ The authorisation structure is empty; please ensure this is correct (i.e. all auth rules are public or signedIn)'
    );
    return;
  }

  // Check if the authorisation structure contains duplicated model names
  for (const rootModel of authorisationStructure) {
    modelNames.push(rootModel.targetModelName);
    modelNames.push(...recursivelyExtractModelNames(rootModel.joins));
  }
  const uniqueModelNames = new Set(modelNames);
  if (uniqueModelNames.size !== modelNames.length) {
    logger.warn(
      '⚠️ The authorisation structure contains duplicated model names; please ensure this is correct'
    );
  }
}

function recursivelyExtractModelNames(
  joins: ModelJoinAuthorisationDetail[] | undefined
): string[] {
  const modelNames: string[] = [];
  if (!joins) {
    return modelNames;
  }
  for (const join of joins) {
    modelNames.push(join.targetModelName);
    if (join.joins && join.joins.length > 0) {
      modelNames.push(...recursivelyExtractModelNames(join.joins));
    }
  }
  return modelNames;
}
