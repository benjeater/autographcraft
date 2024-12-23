import {
  DATABASE_CODES,
  IAutoGraphCraftAuthorisation,
  type AutoGraphCraftAuthorisationInitialisationFromCacheData,
} from '../types';
import { AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD } from '../constants';
import {
  loadMongoDbDataFromDatabase,
  convertAuthIdToAuthFormat,
  splitAuthFormatToModelNameAndAuthId,
} from './helpers';
import type {
  AutoGraphCraftAuthorisationParams,
  AutoGraphCraftAuthorisationInitialisationParams,
} from './types';

/**
 * The AutoGraphCraftAuthorisation class is used to check if the user has the correct permissions
 * to access a specific resolver and document.  This class is instantiated in the context of the
 * application and is passed to all resolvers in the context object.
 */
export class AutoGraphCraftAuthorisation
  implements IAutoGraphCraftAuthorisation
{
  private isInitialised = false;
  private params: AutoGraphCraftAuthorisationParams;
  private allAuthIds: Set<string> = new Set([]);
  private idsPerModel: Record<string, string[]> = {};
  private rootIds: Record<string, string> = {};
  private isAdmin: boolean = false;

  constructor(params: AutoGraphCraftAuthorisationParams) {
    this.params = params;
  }

  public async initialise(
    params: AutoGraphCraftAuthorisationInitialisationParams
  ): Promise<void> {
    // Check that all the authorisation structure root ids are present
    // in the rootIds object
    this.ensureAllRootIdsAreProvided(params.rootIds || {});
    this.rootIds = params.rootIds || {};
    this.isAdmin = params.isAdmin || false;

    // Fetch each root document from the database
    await this.loadDataFromDatabase();
    this.convertAllAuthIdsToIdsPerModel();

    this.isInitialised = true;
  }

  public async initialiseWithCachedData(
    data: AutoGraphCraftAuthorisationInitialisationFromCacheData
  ): Promise<void> {
    this.allAuthIds = new Set(data.allAuthIds);
    this.convertAllAuthIdsToIdsPerModel();
    this.isInitialised = true;
  }

  public getCacheableData(): AutoGraphCraftAuthorisationInitialisationFromCacheData {
    this.checkIfInitialised();
    return {
      allAuthIds: Array.from(this.allAuthIds),
    };
  }

  public hasAuthIdsForModel(modelName: string): boolean {
    this.checkIfInitialised();
    if (AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD.includes(modelName)) {
      return this.checkSpecialModelAuthorisation(modelName);
    }
    return this.getAuthIdsForModel(modelName).length > 0;
  }

  public documentAuthorisation(
    modelName: string,
    idFieldValue?: string
  ): boolean {
    this.checkIfInitialised();

    if (AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD.includes(modelName)) {
      return this.checkSpecialModelAuthorisation(modelName);
    }

    // Check if the document id is in the list of authorised ids
    const idToCheck = convertAuthIdToAuthFormat(modelName, idFieldValue);
    const hasAuthPermission = this.allAuthIds.has(idToCheck);
    this.params.logger?.info({
      message: `Checking document authorisation for ${modelName} with id ${idFieldValue}`,
      hasAuthPermission,
    });
    return hasAuthPermission;
  }

  public getAuthIdsForModel(modelName: string): string[] {
    this.checkIfInitialised();
    const authIdsForModel = this.idsPerModel[modelName] || [];
    return authIdsForModel;
  }

  private checkIfInitialised(): void {
    if (!this.isInitialised) {
      throw new Error(`AutoGraphCraftAuthorisation is not initialised`);
    }
  }

  private ensureAllRootIdsAreProvided(rootIds: Record<string, string>): void {
    const expectedRootModelNames = this.params.authorisationStructure.map(
      (rootNode) => rootNode.targetModelName
    );

    const missingRootIds = expectedRootModelNames.filter(
      (rootModelName) => !rootIds[rootModelName]
    );

    if (missingRootIds.length > 0) {
      this.params.logger?.info(
        `The following root ids are missing when initialising AutoGraphCraftAuthorisation: ${missingRootIds.join(', ')}`
      );
    }
  }

  private async loadDataFromDatabase(): Promise<void> {
    switch (this.params.databaseType) {
      case DATABASE_CODES.MONGO_DB:
        this.allAuthIds = await loadMongoDbDataFromDatabase(
          this.params,
          this.rootIds
        );
        break;
      default:
        throw new Error(
          `Database type ${this.params.databaseType} not supported`
        );
    }
  }

  private convertAllAuthIdsToIdsPerModel(): void {
    this.idsPerModel = Array.from(this.allAuthIds).reduce(
      (acc, authId) => {
        const [modelName, id] = splitAuthFormatToModelNameAndAuthId(authId);
        acc[modelName] = acc[modelName] || [];
        acc[modelName].push(id);
        return acc;
      },
      {} as Record<string, string[]>
    );
  }

  private checkSpecialModelAuthorisation(modelName: string): boolean {
    if (modelName === 'public') {
      return true;
    }
    if (modelName === 'signedIn') {
      return Object.entries(this.rootIds).length > 0;
    }
    if (modelName === 'admin') {
      return this.isAdmin;
    }
    this.params.logger?.warn(
      `Model name ${modelName} is not handled even though it is in the AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD array`
    );
    return false;
  }
}
