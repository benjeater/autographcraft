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

export type MongoDbDeleteResolverParams<ArgType, ReturnType> =
  MongoDbBaseResolverParams<ArgType, ReturnType>;

/**
 * A resolver class that deletes a document from the database based on the id provided in the args,
 * checking that the caller has the necessary permissions to do so.
 */
export class MongoDbDeleteResolver<
  ArgType extends { id: string },
  ReturnType,
> extends MongoDbBaseResolver<ArgType, ReturnType> {
  constructor(params: MongoDbDeleteResolverParams<ArgType, ReturnType>) {
    super(params);
  }

  async delete(): Promise<ReturnType | null> {
    let databaseDocument: ReturnType | null = null;

    try {
      await this.getAndRunHooks(
        RESOLVER_NAME.DELETE,
        HookInNames.INITIAL,
        databaseDocument
      );

      await this.getAndRunHooks(
        RESOLVER_NAME.DELETE,
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
        RESOLVER_NAME.DELETE,
        HookInNames.POST_VALIDATE_ARGS,
        databaseDocument
      );

      await this.getAndRunHooks(
        RESOLVER_NAME.DELETE,
        HookInNames.PRE_ARCHITECTURAL_AUTHORIZE,
        databaseDocument
      );

      // Call the authorization service to check if client has permissions architecturally
      const architecuralAuthorisationResponse =
        await this._architecturalAuthorisation(this.context);
      if (!architecuralAuthorisationResponse) {
        throw new NoArchitecturalAccessError(
          this.modelName,
          RESOLVER_NAME.DELETE
        );
      }

      await this.getAndRunHooks(
        RESOLVER_NAME.DELETE,
        HookInNames.POST_ARCHITECTURAL_AUTHORIZE,
        databaseDocument
      );

      await this.getAndRunHooks(
        RESOLVER_NAME.DELETE,
        HookInNames.PRE_FETCH,
        databaseDocument
      );

      // Fetch the data from the database
      const filter = { _id: this.args.id, deletedAt: null };
      databaseDocument = await this._databaseModel.findOne<ReturnType>(filter);

      if (!databaseDocument) {
        throw new NotFoundError(
          `Document with id ${this.args.id} does not exist, or has already been deleted`
        );
      }

      await this.getAndRunHooks(RESOLVER_NAME.DELETE, HookInNames.POST_FETCH, [
        databaseDocument,
      ]);

      await this.getAndRunHooks(
        RESOLVER_NAME.DELETE,
        HookInNames.PRE_DOCUMENT_AUTHORIZE,
        [databaseDocument]
      );

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

      await this.getAndRunHooks(
        RESOLVER_NAME.DELETE,
        HookInNames.POST_DOCUMENT_AUTHORIZE,
        [databaseDocument]
      );

      await this.getAndRunHooks(RESOLVER_NAME.DELETE, HookInNames.PRE_COMMIT, [
        databaseDocument,
      ]);

      // Delete the document from the database
      const update = { deletedAt: new Date() };
      const databaseDocumentInstance =
        await this._databaseModel.findOneAndUpdate(filter, update);
      databaseDocument = databaseDocumentInstance!.toObject({
        virtuals: true,
      }) as ReturnType;

      await this.getAndRunHooks(RESOLVER_NAME.DELETE, HookInNames.POST_COMMIT, [
        databaseDocument,
      ]);

      const permittedFields = await this._getPermittedFieldsForDocument(
        this.context,
        databaseDocument
      );
      databaseDocument = removeUnauthorisedFieldsFromDocument<ReturnType>(
        databaseDocument,
        permittedFields
      );

      await this.getAndRunHooks(RESOLVER_NAME.DELETE, HookInNames.FINAL, [
        databaseDocument,
      ]);

      return databaseDocument;
    } catch (err) {
      if (err instanceof Error) {
        this.context.autographcraft.logger?.error(err.message);
      } else {
        this.context.autographcraft.logger?.error('An error occurred');
      }

      // Run all the error hooks
      await this.getAndRunHooks(
        RESOLVER_NAME.DELETE,
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
