import { GraphQLError } from 'graphql';
import {
  HookInNames,
  RESOLVER_NAME,
  type AutoGraphCraftResolverContext,
} from '@autographcraft/core';
import { NoArchitecturalAccessError } from '../errors';
import {
  MongoDbBaseResolver,
  type MongoDbBaseResolverParams,
} from './MongoDbBaseResolver';
import {
  FilterConverterMongoDB,
  type FilterConverterMongoDBParams,
} from '../filterConverter';
import { removeUnauthorisedFieldsFromDocument } from '../../helpers';

type ArgSort = {
  field: string;
  direction: 'ASC' | 'DESC';
};

type DecodedNextToken = {
  skip?: number;
};

const DEFAULT_LIST_QUERY_LIMIT = 100;

export type MongoDbListResolverParams<ArgType, ReturnType> =
  MongoDbBaseResolverParams<ArgType, ReturnType> & {
    getListFilter: (
      context: AutoGraphCraftResolverContext
    ) => Promise<Record<string, unknown>>;
  };

type Maybe<T> = T | null;

type TemplateArgType = {
  filter?: Maybe<Record<string, unknown>>;
  limit?: Maybe<number>;
  nextToken?: Maybe<string>;
  sort?: Maybe<Record<string, unknown>[]>;
};

type TemplateListReturnType<ReturnType> = {
  results: Maybe<ReturnType>[];
  nextToken?: string | null;
};

export class MongoDbListResolver<
  ArgType extends TemplateArgType,
  ReturnType,
  ListReturnType extends TemplateListReturnType<ReturnType>,
> extends MongoDbBaseResolver<ArgType, ReturnType> {
  private getListFilter: (
    context: AutoGraphCraftResolverContext
  ) => Promise<Record<string, unknown>>;

  constructor(params: MongoDbListResolverParams<ArgType, ReturnType>) {
    super(params);
    this.getListFilter = params.getListFilter;
  }

  async list(): Promise<ListReturnType | null> {
    let databaseDocuments: ReturnType[] | null = null;

    try {
      // Check if the filter includes a key named 'deletedAt' and add it if it doesn't
      if (!this.filterIncludesDeletedAtKey(this.args.filter || {})) {
        if (!this.args.filter) {
          this.args.filter = {};
        }
        this.args.filter.deletedAt = { eq: null };
      }

      await this.getAndRunHooks(HookInNames.INITIAL, databaseDocuments);

      await this.getAndRunHooks(
        HookInNames.PRE_VALIDATE_ARGS,
        databaseDocuments
      );

      await this.getAndRunHooks(
        HookInNames.POST_VALIDATE_ARGS,
        databaseDocuments
      );

      await this.getAndRunHooks(
        HookInNames.PRE_ARCHITECTURAL_AUTHORIZE,
        databaseDocuments
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
        databaseDocuments
      );

      await this.getAndRunHooks(HookInNames.PRE_FETCH, databaseDocuments);

      // Have auth converted to a filter
      const argsFilter = this.convertArgsToFilter();
      this.context.autographcraft.logger?.debug(
        `argsFilter: ${JSON.stringify(argsFilter, null, 2)}`
      );
      const authFilter = await this.getListFilter(this.context);
      this.context.autographcraft.logger?.debug(
        `authFilter: ${JSON.stringify(authFilter, null, 2)}`
      );
      const fullFilter = {
        $and: [argsFilter, authFilter].filter(this.isPopulatedObject),
      };
      this.context.autographcraft.logger?.info(
        `Filtering documents using filter: ${JSON.stringify(
          fullFilter,
          null,
          2
        )}`
      );

      // Fetch the data from the database
      databaseDocuments = (await this._databaseModel.find<ReturnType>(
        fullFilter,
        undefined,
        this.getQueryOptions()
      )) as ReturnType[] | null;

      await this.getAndRunHooks(HookInNames.POST_FETCH, databaseDocuments);

      await this.getAndRunHooks(
        HookInNames.PRE_DOCUMENT_AUTHORIZE,
        databaseDocuments
      );

      await this.getAndRunHooks(
        HookInNames.POST_DOCUMENT_AUTHORIZE,
        databaseDocuments
      );

      const documentObjects =
        databaseDocuments?.map(
          (doc) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (doc as any).toObject({
              virtuals: true,
            }) as ReturnType
        ) || (null as ReturnType[] | null);

      const results = await Promise.all(
        documentObjects?.map(async (doc) => {
          const permittedFields = await this._getPermittedFieldsForDocument(
            this.context,
            doc
          );
          const returnDocument =
            await removeUnauthorisedFieldsFromDocument<ReturnType>(
              doc,
              permittedFields
            );

          return returnDocument;
        }) || []
      );

      await this.getAndRunHooks(HookInNames.FINAL, results);

      const returnObject = {
        results,
        nextToken: this.getReturnNextToken(documentObjects),
      } as ListReturnType;

      return returnObject;
    } catch (err) {
      if (err instanceof Error) {
        this.context.autographcraft.logger?.error(err.message);
      } else {
        this.context.autographcraft.logger?.error('An error occurred');
      }

      // Run all the error hooks
      await this.getAndRunHooks(HookInNames.ERROR, databaseDocuments);

      // If the error is not a GraphQLError, throw a generic error wrapped in a GraphQLError
      if (!(err instanceof GraphQLError)) {
        const message =
          err instanceof Error ? err.message : 'An error occurred';
        throw new GraphQLError(message);
      }

      throw err;
    }
  }

  private convertArgsToFilter(): Record<string, unknown> {
    const params: FilterConverterMongoDBParams = {
      context: this.context,
      filter: this.args.filter || {},
    };
    const filterConverter = new FilterConverterMongoDB(params);
    const filter = filterConverter.convert();
    return filter;
  }

  private isPopulatedObject(obj: Record<string, unknown>): boolean {
    const isEmpty = Object.keys(obj).length === 0 && obj.constructor === Object;
    return !isEmpty;
  }

  /**
   * Recursively checks the filter object for a key named 'deletedAt' and
   * returns a boolean indicating if the key is present.
   * @param filter The filter object to check
   * @returns A boolean indicating if the filter object contains a key named 'deletedAt'
   */
  private filterIncludesDeletedAtKey(filter: Record<string, unknown>): boolean {
    if (Object.keys(filter).includes('deletedAt')) {
      return true;
    }

    for (const key in filter) {
      if (typeof filter[key] === 'object') {
        return this.filterIncludesDeletedAtKey(
          filter[key] as Record<string, unknown>
        );
      }
    }

    return false;
  }

  private getQueryOptions(): Record<string, unknown> {
    const returnOptions: Record<string, unknown> = {
      limit: this.getLimitForQuery(),
      skip: this.getSkipForQuery(),
    };
    const sort = this.getSortForQuery();
    if (sort) {
      returnOptions.sort = sort;
    }
    return returnOptions;
  }

  private getLimitForQuery(): number {
    try {
      const limit =
        this.args.limit ||
        this.context.autographcraft.defaultListQueryLimit ||
        DEFAULT_LIST_QUERY_LIMIT;
      if (this.context.autographcraft.maxListQueryLimit) {
        return Math.min(limit, this.context.autographcraft.maxListQueryLimit);
      }
      return limit;
    } catch (err) {
      this.context.autographcraft.logger?.warn(
        `An error occurred while getting the limit for the query; using default limit of ${DEFAULT_LIST_QUERY_LIMIT}`
      );
      return DEFAULT_LIST_QUERY_LIMIT;
    }
  }

  private getSortForQuery(): Record<string, number> | null {
    if (
      !this.args.sort ||
      !Array.isArray(this.args.sort) ||
      this.args.sort.length === 0
    ) {
      return null;
    }

    const returnSort: Record<string, number> = {};

    for (const sort of this.args.sort as ArgSort[]) {
      returnSort[sort.field] = sort.direction === 'ASC' ? 1 : -1;
    }

    return returnSort;
  }

  private getSkipForQuery(): number {
    const nextTokenDetails = this.getDecodedNextToken();
    return nextTokenDetails.skip || 0;
  }

  private getReturnNextToken(
    returnDocuments: ReturnType[] | null
  ): string | null {
    if (!returnDocuments) {
      return null;
    }
    if (returnDocuments.length === 0) {
      return null;
    }
    if (returnDocuments.length < this.getLimitForQuery()) {
      return null;
    }
    const nextToken = this.getEncodedNextToken();
    return nextToken;
  }

  private getDecodedNextToken(): DecodedNextToken {
    try {
      const parsedNextToken = JSON.parse(this.args.nextToken || '{}');
      if (parsedNextToken.skip === undefined) {
        return parsedNextToken;
      }
      if (typeof parsedNextToken.skip !== 'number') {
        return {};
      }
      return parsedNextToken;
    } catch (err) {
      this.context.autographcraft.logger?.warn(
        'An error occurred while decoding the next token; using default next token values'
      );
      return {};
    }
  }

  private getEncodedNextToken(): string | null {
    try {
      const nextTokenDetails: DecodedNextToken = {
        skip: this.getSkipForQuery() + this.getLimitForQuery(),
      };
      return JSON.stringify(nextTokenDetails);
    } catch (err) {
      this.context.autographcraft.logger?.warn(
        'An error occurred while encoding the next token; returning null'
      );
      return null;
    }
  }
}
