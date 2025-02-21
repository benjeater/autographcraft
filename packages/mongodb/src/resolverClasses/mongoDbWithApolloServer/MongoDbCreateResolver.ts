import { GraphQLError } from 'graphql';
import { HookInNames, RESOLVER_NAME } from '@autographcraft/core';
import { NoArchitecturalAccessError, NotAuthorisedError } from '../errors';
import {
  MongoDbBaseResolver,
  type MongoDbBaseResolverParams,
} from './MongoDbBaseResolver';
import { removeUnauthorisedFieldsFromDocument } from '../../helpers';

export type MongoDbCreateResolverParams<ArgType, ReturnType> =
  MongoDbBaseResolverParams<ArgType, ReturnType>;

export class MongoDbCreateResolver<
  ArgType extends { input: Record<string, unknown> },
  ReturnType,
> extends MongoDbBaseResolver<ArgType, ReturnType> {
  constructor(params: MongoDbCreateResolverParams<ArgType, ReturnType>) {
    super(params);
  }

  async create(): Promise<ReturnType | null> {
    let databaseDocument: ReturnType | null = null;

    try {
      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.INITIAL,
        databaseDocument
      );

      // Remove the unauthorised fields from the input object
      const permittedFieldsForInput = await this._getPermittedFieldsForDocument(
        this.context,
        this.args.input as ReturnType
      );
      this.args.input = removeUnauthorisedFieldsFromDocument<ReturnType>(
        this.args.input as ReturnType,
        permittedFieldsForInput
      ) as ArgType['input'];

      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.PRE_VALIDATE_ARGS,
        databaseDocument
      );

      // No arg validation is required for create

      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.POST_VALIDATE_ARGS,
        databaseDocument
      );

      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.PRE_ARCHITECTURAL_AUTHORIZE,
        databaseDocument
      );

      // Call the authorization service to check if client has permissions architecturally
      const architecuralAuthorisationResponse =
        await this._architecturalAuthorisation(this.context);
      if (!architecuralAuthorisationResponse) {
        throw new NoArchitecturalAccessError(
          this.modelName,
          RESOLVER_NAME.CREATE
        );
      }

      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.POST_ARCHITECTURAL_AUTHORIZE,
        databaseDocument
      );

      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.PRE_DOCUMENT_AUTHORIZE,
        databaseDocument
      );

      // Call the authorization service to check if client has permissions
      // for the specific document being accessed
      const documentAuthorisationResponse = await this._documentAuthorisation(
        this.context,
        this.args.input as ReturnType
      );
      if (!documentAuthorisationResponse) {
        throw new NotAuthorisedError(
          `Caller does not have permission to create a document with the provided input`
        );
      }

      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.POST_DOCUMENT_AUTHORIZE,
        databaseDocument
      );

      // Convert the args to an instance of the database model
      const documentInstance = new this._databaseModel(this.args.input);

      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.PRE_VALIDATE_DOCUMENT,
        [documentInstance as ReturnType]
      );

      // Validate the document
      await documentInstance.validate();

      await this.getAndRunHooks(
        RESOLVER_NAME.CREATE,
        HookInNames.POST_VALIDATE_DOCUMENT,
        [documentInstance as ReturnType]
      );

      await this.getAndRunHooks(RESOLVER_NAME.CREATE, HookInNames.PRE_COMMIT, [
        documentInstance as ReturnType,
      ]);

      // Create the document in the database
      const databaseDocumentInstance = await documentInstance.save();
      databaseDocument = databaseDocumentInstance.toObject({
        virtuals: true,
      }) as ReturnType;

      await this.getAndRunHooks(RESOLVER_NAME.CREATE, HookInNames.POST_COMMIT, [
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

      await this.getAndRunHooks(RESOLVER_NAME.CREATE, HookInNames.FINAL, [
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
        RESOLVER_NAME.CREATE,
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
