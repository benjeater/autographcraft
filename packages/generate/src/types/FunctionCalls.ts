export type ProcessFunction = (
  execPath: string,
  params: string[]
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
