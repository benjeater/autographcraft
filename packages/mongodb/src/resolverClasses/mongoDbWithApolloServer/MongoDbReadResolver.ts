import { GraphQLError } from 'graphql';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import { MONGO_DB_ID_REGEX } from '../constants';
import {
  InvalidInputError,
  NoArchitecturalAccessError,
  NotAuthorisedError,
  NotFoundError,
} from '../errors';
import {
  MongoDbBaseResolver,
  type MongoDbBaseResolverParams,
} from './MongoDbBaseResolver';
import { removeUnauthorisedFieldsFromDocument } from '../../helpers';

export type MongoDbReadResolverParams<ArgType, ReturnType> =
  MongoDbBaseResolverParams<ArgType, ReturnType>;

/**
 * A resolver class that fetches a document from the database based on the id provided in the args,
 * checking that the caller has the necessary permissions to do so.
 */
export class MongoDbReadResolver<
  ArgType extends { id: string },
  ReturnType,
> extends MongoDbBaseResolver<ArgType, ReturnType> {
  constructor(params: MongoDbReadResolverParams<ArgType, ReturnType>) {
    super(params);
  }

  /**
   * Fetches a document from the database based on the id provided in the args,
   * checking that the caller has the necessary permissions to do so.
   * @returns {Promise<ReturnType | null>} The document that was read from the database
   */
  async read(): Promise<ReturnType | null> {
    let databaseDocument: ReturnType | null = null;

    try {
      await this.getAndRunHooks(HookInNames.INITIAL, databaseDocument);

      await this.getAndRunHooks(
        HookInNames.PRE_VALIDATE_ARGS,
        databaseDocument
      );

      // Validate the input data exists (i.e. the id is present and in the correct format)
      if (!this.args.id.match(MONGO_DB_ID_REGEX)) {
        throw new InvalidInputError(
          `id ${this.args.id} is not a valid MongoDB ObjectId`
        );
      }

      await this.getAndRunHooks(
        HookInNames.POST_VALIDATE_ARGS,
        databaseDocument
      );

      await this.getAndRunHooks(
        HookInNames.PRE_ARCHITECTURAL_AUTHORIZE,
        databaseDocument
      );

      // Call the authorization service to check if client has permissions architecturally
      const architecuralAuthorisationResponse =
        await this._architecturalAuthorisation(this.context);
      if (!architecuralAuthorisationResponse) {
        throw new NoArchitecturalAccessError(
          this.modelName,
          RESOLVER_NAME.READ
        );
      }

      await this.getAndRunHooks(
        HookInNames.POST_ARCHITECTURAL_AUTHORIZE,
        databaseDocument
      );

      await this.getAndRunHooks(HookInNames.PRE_FETCH, databaseDocument);

      // Fetch the data from the database
      databaseDocument = await this._databaseModel.findById<ReturnType>(
        this.args.id
      );
      if (!databaseDocument) {
        throw new NotFoundError(
          `Document with id ${this.args.id} does not exist, or you do not have permission to access it`
        );
      }

      await this.getAndRunHooks(HookInNames.POST_FETCH, [databaseDocument]);

      await this.getAndRunHooks(HookInNames.PRE_DOCUMENT_AUTHORIZE, [
        databaseDocument,
      ]);

      // Call the authorization service to check if client has permissions
      // for the specific document being accessed
      const documentAuthorisationResponse = await this._documentAuthorisation(
        this.context,
        databaseDocument
      );
      if (!documentAuthorisationResponse) {
        throw new NotAuthorisedError(
          `Caller does not have permission to access document with id ${this.args.id}`
        );
      }

      await this.getAndRunHooks(HookInNames.POST_DOCUMENT_AUTHORIZE, [
        databaseDocument,
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let returnDocument = (databaseDocument as any).toObject({
        virtuals: true,
      });

      const permittedFields = await this._getPermittedFieldsForDocument(
        this.context,
        databaseDocument
      );
      returnDocument = removeUnauthorisedFieldsFromDocument<ReturnType>(
        returnDocument,
        permittedFields
      );

      await this.getAndRunHooks(HookInNames.FINAL, [databaseDocument]);
      return returnDocument;
    } catch (err) {
      if (err instanceof Error) {
        this.context.autographcraft.logger?.error(err.message);
      } else {
        this.context.autographcraft.logger?.error('An error occurred');
      }

      // Run all the error hooks
      await this.getAndRunHooks(
        HookInNames.ERROR,
        databaseDocument ? [databaseDocument] : null
      );

      // If the error is not a GraphQLError, throw a generic error wrapped in a GraphQLError
      if (!(err instanceof GraphQLError)) {
        const message =
          err instanceof Error ? err.message : 'An error occurred';
        throw new GraphQLError(message);
      }

      throw err;
    }
  }
}
