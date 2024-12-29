import mongoose from 'mongoose';
import {
  HookInNames,
  RESOLVER_CATEGORY_TYPE,
  RESOLVER_NAME,
} from '@autographcraft/core';
import type {
  AutoGraphCraftResolverContext,
  ExtendedResolverType,
} from '@autographcraft/core';
import type { HookInFile } from '../types';

export type MongoDbBaseResolverParams<ArgType, ReturnType> = {
  modelName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  databaseModel: mongoose.Model<any>;
  hookInFiles: HookInFile[];
  parent: unknown;
  args: ArgType;
  context: AutoGraphCraftResolverContext;
  info: unknown;
  architecturalAuthorisation: (
    context: AutoGraphCraftResolverContext
  ) => Promise<boolean>;
  documentAuthorisation: (
    context: AutoGraphCraftResolverContext,
    document: ReturnType
  ) => Promise<boolean>;
  getPermittedFieldsForDocument: (
    context: AutoGraphCraftResolverContext,
    document: ReturnType
  ) => Promise<Set<string>>;
};

const QUERY_RESOLVER_NAMES = [RESOLVER_NAME.READ, RESOLVER_NAME.LIST];

const MUTATION_RESOLVER_NAMES = [
  RESOLVER_NAME.CREATE,
  RESOLVER_NAME.UPDATE,
  RESOLVER_NAME.DELETE,
];

const QUERY_OR_MUTATION_TYPE: ExtendedResolverType[] = [
  RESOLVER_CATEGORY_TYPE.QUERIES,
  RESOLVER_CATEGORY_TYPE.MUTATIONS,
];

export class MongoDbBaseResolver<ArgType, ReturnType> {
  public parent: unknown;
  public args: ArgType;
  public context: AutoGraphCraftResolverContext;
  public info: unknown;
  public modelName: string;
  protected _databaseModel: mongoose.Model<mongoose.Document>;
  private hookInFiles: HookInFile[];
  protected _architecturalAuthorisation: (
    context: AutoGraphCraftResolverContext
  ) => Promise<boolean>;
  protected _documentAuthorisation: (
    context: AutoGraphCraftResolverContext,
    document: ReturnType
  ) => Promise<boolean>;
  protected _getPermittedFieldsForDocument: (
    context: AutoGraphCraftResolverContext,
    document: ReturnType
  ) => Promise<Set<string>>;

  constructor(params: MongoDbBaseResolverParams<ArgType, ReturnType>) {
    this.parent = params.parent;
    this.args = params.args;
    this.context = params.context;
    this.info = params.info;
    this.modelName = params.modelName;
    this._databaseModel = params.databaseModel;
    this.hookInFiles = params.hookInFiles;
    this._architecturalAuthorisation = params.architecturalAuthorisation;
    this._documentAuthorisation = params.documentAuthorisation;
    this._getPermittedFieldsForDocument = params.getPermittedFieldsForDocument;
  }

  async getAndRunHooks(
    hookPoint: HookInNames,
    databaseDocuments: ReturnType[] | null
  ): Promise<void> {
    const hookIns = this.getHookIns(RESOLVER_NAME.READ, hookPoint);
    this.context.autographcraft.logger?.debug({
      [`${hookPoint}Hooks`]: hookIns,
    });
    await this.runHooks(hookIns, databaseDocuments);
  }

  private getHookIns(
    resolverName: RESOLVER_NAME,
    hookPoint: HookInNames
  ): HookInFile[] {
    // Create an array of resolver names to search for
    const resolverNames: ExtendedResolverType[] = [
      resolverName,
      RESOLVER_CATEGORY_TYPE.ALL,
    ];

    // Extend the type with queries/mutations
    if (QUERY_RESOLVER_NAMES.includes(resolverName)) {
      resolverNames.push(RESOLVER_CATEGORY_TYPE.QUERIES);
    }
    if (MUTATION_RESOLVER_NAMES.includes(resolverName)) {
      resolverNames.push(RESOLVER_CATEGORY_TYPE.MUTATIONS);
    }

    // Filter the hookInFiles to only include the ones that match the resolverName and hookPoint
    const hooks = this.hookInFiles.filter((hookInFile) => {
      return (
        resolverNames.includes(hookInFile.resolverName) &&
        hookInFile.hookPoint === hookPoint
      );
    });

    // Split the hooks into three arrays; exact matches, resolver type matches, and all matches
    const exactMatches = hooks.filter(
      (hook) => hook.resolverName === resolverName
    );
    const resolverTypeMatches = hooks.filter((hook) =>
      QUERY_OR_MUTATION_TYPE.includes(hook.resolverName)
    );
    const allMatches = hooks.filter(
      (hook) => hook.resolverName === RESOLVER_CATEGORY_TYPE.ALL
    );

    // Sort the hooks by order number
    exactMatches.sort((a, b) => a.orderNumber - b.orderNumber);
    resolverTypeMatches.sort((a, b) => a.orderNumber - b.orderNumber);
    allMatches.sort((a, b) => a.orderNumber - b.orderNumber);

    // Return an array of the files in the order they should be run
    return [...exactMatches, ...resolverTypeMatches, ...allMatches];
  }

  private async runHooks(
    hookIns: HookInFile[],
    documents: ReturnType[] | null
  ): Promise<void> {
    for (const hookIn of hookIns) {
      await hookIn.defaultFunction(
        this.parent,
        this.args,
        this.context,
        this.info,
        documents
      );
    }
  }
}
