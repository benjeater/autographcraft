/**
 * The parsed command line arguments, in the shape yargs produces: the
 * positional arguments in `_`, plus any named flags parsed alongside them.
 */
export type ProcessFunctionParams = {
  [flagName: string]: string | boolean | number | string[] | undefined;
  _: string[];
};

export type ProcessFunction = (
  execPath: string,
  params: ProcessFunctionParams
) => Promise<void>;

export enum PROCESS_ARGUMENT_VECTOR_CODES {
  INIT,
  CONFIG,
  HELP,
  GENERATE,
}

export type ProcessArgumentVector = {
  argument: string;
  description: string;
  code: PROCESS_ARGUMENT_VECTOR_CODES;
};
