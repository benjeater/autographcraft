import mongoose from 'mongoose';
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

export type MongoDbUpdateResolverParams<ArgType, ReturnType> =
  MongoDbBaseResolverParams<ArgType, ReturnType>;

export class MongoDbUpdateResolver<
  ArgType extends { input: Record<string, unknown> },
  ReturnType
> extends MongoDbBaseResolver<ArgType, ReturnType> {
  constructor(params: MongoDbUpdateResolverParams<ArgType, ReturnType>) {
    super(params);
  }

  async update(): Promise<ReturnType | null> {
    let databaseDocument: ReturnType | null = null;

    try {
      await this.getAndRunHooks(HookInNames.INITIAL, databaseDocument);

      await this.getAndRunHooks(
        HookInNames.PRE_VALIDATE_ARGS,
        databaseDocument
      );

      // Validate the input data exists (i.e. the id is present and in the correct format)
      if (!(this.args.input.id as string).match(MONGO_DB_ID_REGEX)) {
        throw new InvalidInputError(
          `id ${this.args.input.id} is not a valid MongoDB ObjectId`
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
      const filter = { _id: this.args.input.id, deletedAt: null };
      databaseDocument = await this._databaseModel.findOne<ReturnType>(filter);

      if (!databaseDocument) {
        throw new NotFoundError(
          `Document with id ${this.args.input.id} does not exist, or has already been deleted`
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
        this.args.input as ReturnType
      );
      if (!documentAuthorisationResponse) {
        throw new NotAuthorisedError(
          `Caller does not have permission to access document with id ${this.args.input.id}`
        );
      }

      await this.getAndRunHooks(HookInNames.POST_DOCUMENT_AUTHORIZE, [
        databaseDocument,
      ]);

      // Merge the input data with the existing data
      const updatedDocumentInstance =
        this.mergeInputWithDatabaseDocument(databaseDocument);

      await this.getAndRunHooks(HookInNames.PRE_COMMIT, [
        updatedDocumentInstance as ReturnType,
      ]);

      // Delete the document from the database
      const databaseDocumentInstance = await updatedDocumentInstance.save();
      databaseDocument = databaseDocumentInstance.toObject({
        virtuals: true,
      });

      await this.getAndRunHooks(HookInNames.POST_COMMIT, [
        databaseDocument as ReturnType,
      ]);

      await this.getAndRunHooks(HookInNames.FINAL, [
        databaseDocument as ReturnType,
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

  private mergeInputWithDatabaseDocument(
    databaseDocument: ReturnType
  ): mongoose.Document<ReturnType> {
    // Convert the args to an instance of the database model
    const documentInstance = new this._databaseModel<ReturnType>(
      databaseDocument
    );

    // Merge the input data with the existing data
    for (const [key, value] of Object.entries(this.args.input)) {
      if (key === 'id') {
        continue;
      }
      // @ts-expect-error - This is a dynamic key, so we can't use dot notation
      documentInstance[key] = value;
    }

    return documentInstance as mongoose.Document<ReturnType>;
  }
}
