import {
  GraphQLError,
  type GraphQLErrorOptions,
  type GraphQLErrorExtensions,
} from 'graphql';

const ERROR_CODES: Record<string, string> = {
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  NO_ARCHITECTURAL_ACCESS: 'NO_ARCHITECTURAL_ACCESS',
  NOT_AUTHORISED: 'NOT_AUTHORISED',
};

export class InvalidInputError extends GraphQLError {
  constructor(message: string, extensions?: GraphQLErrorExtensions) {
    const options: GraphQLErrorOptions = {
      extensions: {
        code: ERROR_CODES.INVALID_INPUT,
        ...extensions,
      },
    };
    super(message, options);
  }
}

export class NotFoundError extends GraphQLError {
  constructor(message: string, extensions?: GraphQLErrorExtensions) {
    const options: GraphQLErrorOptions = {
      extensions: {
        code: ERROR_CODES.NOT_FOUND,
        ...extensions,
      },
    };
    super(message, options);
  }
}

export class NoArchitecturalAccessError extends GraphQLError {
  constructor(
    modelName: string,
    operation: string,
    extensions?: GraphQLErrorExtensions
  ) {
    const options: GraphQLErrorOptions = {
      extensions: {
        code: ERROR_CODES.NO_ARCHITECTURAL_ACCESS,
        ...extensions,
      },
    };
    const message = `Caller does not have permission to perform the ${operation} operation on ${modelName}`;
    super(message, options);
  }
}

export class NotAuthorisedError extends GraphQLError {
  constructor(message: string, extensions?: GraphQLErrorExtensions) {
    const options: GraphQLErrorOptions = {
      extensions: {
        code: ERROR_CODES.NOT_AUTHORISED,
        ...extensions,
      },
    };
    super(message, options);
  }
}
