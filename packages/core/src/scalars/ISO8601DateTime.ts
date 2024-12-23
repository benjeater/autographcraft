import { GraphQLScalarType, Kind } from 'graphql';

export const ISO8601DateTime = new GraphQLScalarType({
  name: 'ISO8601DateTime',
  description: `An ISO8601 representation of a date and time in the form of \`YYYY-MM-DDTHH:MM:SS.SSS\` with or without the milliseconds.  
    The representation should finish with a \`Z\` to indicate UTC time or a timezone offset in the form of \`+HH:MM\` or \`-HH:MM\`.
    If the timezone offset and \`Z\` are omitted, the time is assumed to be representing UTC and will have the \`Z\` appended.
    Alternatively, the time can be completely omitted, in which case the representation should be in the form of \`YYYY-MM-DD\` and the time will be assumed to 
    be midnight UTC on the provided date.

    Years with less than 3 digits are not allowed.  If your to represent a year with less than 3 digits, please pad the year with zeros to make it 4 digits long.

    The following are some examples of acceptable ISO8601DateTimes: 
    \`2021-01-01T12:43:54.987Z\`
    \`2021-01-01T12:43:54.987+05:30\`
    \`2021-01-01T12:43:54.987-05:30\`
    \`2021-01-01T12:43:54-05:30\`
    \`2021-01-01T12:43:54Z\`
    \`2021-01-01T12:43:54\`
    \`2021-01-01\`
    \`2021-01\`
    \`2021\`

    Dates will always be returned in the form of a UTC ISO8601DateTime string (i.e. ending with a \`Z\`).
    `,

  serialize(value): string | null {
    if (value instanceof Date) {
      return value.toISOString(); // Convert outgoing Date to string for JSON
    }
    throw Error(
      'GraphQL ISO8601DateTime Scalar serializer expected a `Date` object'
    );
  },

  parseValue(value): Date | null {
    if (typeof value !== 'string') {
      throw new Error(
        'GraphQL ISO8601DateTime Scalar parser expected a `string`'
      );
    }

    const newDate = new Date(value);

    if (isNaN(newDate.getTime())) {
      throw new Error('Invalid ISO8601 date string provided');
    }

    return newDate;
  },

  parseLiteral(ast): Date | null {
    if (ast.kind !== Kind.STRING) {
      // Invalid hard-coded value (not an integer)
      return null;
    }

    // Convert hard-coded AST string to Date
    return new Date(ast.value);
  },
});
