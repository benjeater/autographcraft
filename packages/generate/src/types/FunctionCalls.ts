export type ProcessFunctionParams = Record<
  string,
  string | boolean | number
> & {
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
