import mongoose from 'mongoose';
import type { ModelJoinAuthorisationDetail } from '../../types';
import type { AutoGraphCraftAuthorisationParams } from '../types';
import { convertAuthIdToAuthFormat } from './convertAuthIdToAuthFormat';

type ModelDocuments = {
  modelName: string;
  documents: mongoose.Document[];
  childDocuments?: ModelDocuments[];
};

/**
 * Fetches all the data from the database for the given rootIds and the rest of the authorisation
 * structure, returning the ids of the documents that were fetched as an array of strings with the
 * form `modelName::documentId`.
 *
 * @param params The authorisation parameters provided to the authorisation class
 * @param rootIds The model names and ids of the root documents to fetch
 * @returns An array of strings with the form `modelName::documentId`
 */
export async function loadMongoDbDataFromDatabase(
  params: AutoGraphCraftAuthorisationParams,
  rootIds: Record<string, string>
): Promise<Set<string>> {
  const allAuthIds: string[] = [];

  for (const [modelName, id] of Object.entries(rootIds)) {
    // For each entry in the params.authorisationStructure, add the id to the allAuthIds array
    allAuthIds.push(convertAuthIdToAuthFormat(modelName, id));

    const authStructureForModel = params.authorisationStructure.find(
      (authStructure) => authStructure.targetModelName === modelName
    );

    // If there are joins, fetch the data from all the joined models using the join details
    if (
      authStructureForModel?.joins &&
      authStructureForModel.joins.length > 0
    ) {
      // Fetch the document from the database
      const Model = params.mongooseConnection.model(modelName);
      const document = await Model.findById(id);
      if (!document) {
        continue;
      }

      const joinedAuthResults = await Promise.all(
        authStructureForModel.joins.map(async (join) => {
          return recursivelyFetchDataFromJoinedModels(params, join, [document]);
        })
      );

      const flattenedJoinedAuthResults =
        flattenJoinedAuthResults(joinedAuthResults);

      allAuthIds.push(...flattenedJoinedAuthResults);
    }
  }

  return new Set(allAuthIds);
}

async function recursivelyFetchDataFromJoinedModels(
  params: AutoGraphCraftAuthorisationParams,
  join: ModelJoinAuthorisationDetail,
  parentDocuments: mongoose.Document[]
): Promise<ModelDocuments> {
  switch (join.sourceJoinType) {
    case 'hasOne':
    case 'hasMany':
      return await getChildDocumentsForJoin(params, join, parentDocuments);
    default:
      throw new Error(`Unknown join type: ${join.sourceJoinType}`);
  }
}

async function getChildDocumentsForJoin(
  params: AutoGraphCraftAuthorisationParams,
  join: ModelJoinAuthorisationDetail,
  parentDocuments: mongoose.Document[]
): Promise<ModelDocuments> {
  const Model = params.mongooseConnection.model(join.targetModelName);
  const parentDocumentIds: string[] = parentDocuments.map((parentDocument) => {
    return parentDocument.get(join.sourceIdFieldName).toString();
  });

  const documents: mongoose.Document[] = await Model.find({
    [join.targetModelIdFieldName]: { $in: parentDocumentIds },
  });

  const childDocuments: ModelDocuments[] = [];

  if (join.joins && join.joins.length > 0) {
    const joinedAuthResults = await Promise.all(
      join.joins.map(async (childJoin) => {
        return recursivelyFetchDataFromJoinedModels(
          params,
          childJoin,
          documents
        );
      })
    );
    const flattenedJoinedAuthResults = joinedAuthResults.flat();
    childDocuments.push(...flattenedJoinedAuthResults);
  }

  return { modelName: join.targetModelName, documents, childDocuments };
}

function flattenJoinedAuthResults(
  joinedAuthResults: ModelDocuments[]
): string[] {
  const allAuthIds: string[] = [];

  for (const joinedAuthResult of joinedAuthResults) {
    allAuthIds.push(
      ...joinedAuthResult.documents.map((document) => {
        return convertAuthIdToAuthFormat(
          joinedAuthResult.modelName,
          document.get('id').toString()
        );
      })
    );

    if (joinedAuthResult.childDocuments) {
      const childAuthIds = flattenJoinedAuthResults(
        joinedAuthResult.childDocuments
      );
      allAuthIds.push(...childAuthIds);
    }
  }

  return allAuthIds;
}
