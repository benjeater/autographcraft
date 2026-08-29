import { describe, expect, it } from '@jest/globals';
import { print } from 'graphql';
import { PossibleFilters, type ScalarDetail } from '@autographcraft/core';
import { convertScalarDetailToScalarFilterInput } from '../convertScalarDetailToScalarFilterInput';

function getScalarDetail(filtersAvailable: PossibleFilters[]): ScalarDetail {
  return {
    scalarName: 'MyScalar',
    javascriptType: 'string',
    filtersAvailable,
  };
}

describe('convertScalarDetailToScalarFilterInput', () => {
  it('should be defined', () => {
    // Assert
    expect(convertScalarDetailToScalarFilterInput).toBeDefined();
  });

  it('should throw an error naming the scalar when it has no filters available', () => {
    // Arrange
    const scalar = getScalarDetail([]);

    // Act / Assert
    expect(() => convertScalarDetailToScalarFilterInput(scalar)).toThrow(
      'The scalar "MyScalar" has no filters available. Add at least one filter to the "filtersAvailable" list for this scalar so that a valid "MyScalarInput" filter input type can be generated.'
    );
  });

  it('should not report a graphql syntax error when the scalar has no filters available', () => {
    // Arrange
    const scalar = getScalarDetail([]);

    // Act / Assert
    expect(() => convertScalarDetailToScalarFilterInput(scalar)).not.toThrow(
      /Syntax Error/
    );
  });

  it('should type the exists filter as a Boolean', () => {
    // Arrange
    const scalar = getScalarDetail([PossibleFilters.exists]);

    // Act
    const result = convertScalarDetailToScalarFilterInput(scalar);

    // Assert
    expect(print(result)).toContain('exists: Boolean');
  });

  it.each([PossibleFilters.in, PossibleFilters.notIn, PossibleFilters.between])(
    'should type the %s filter as a non-null list of the scalar',
    (filter) => {
      // Arrange
      const scalar = getScalarDetail([filter]);

      // Act
      const result = convertScalarDetailToScalarFilterInput(scalar);

      // Assert
      expect(print(result)).toContain(`${filter}: [MyScalar!]`);
    }
  );

  it.each([
    PossibleFilters.eq,
    PossibleFilters.ne,
    PossibleFilters.le,
    PossibleFilters.lt,
    PossibleFilters.ge,
    PossibleFilters.gt,
    PossibleFilters.startsWith,
  ])('should type the %s filter as the bare scalar', (filter) => {
    // Arrange
    const scalar = getScalarDetail([filter]);

    // Act
    const result = convertScalarDetailToScalarFilterInput(scalar);

    // Assert
    expect(print(result)).toContain(`${filter}: MyScalar`);
    expect(print(result)).not.toContain('[MyScalar!]');
  });

  it('should include every available filter in a single input type', () => {
    // Arrange
    const scalar = getScalarDetail([
      PossibleFilters.eq,
      PossibleFilters.in,
      PossibleFilters.exists,
    ]);

    // Act
    const result = convertScalarDetailToScalarFilterInput(scalar);

    // Assert
    expect(print(result)).toBe(
      [
        'input MyScalarInput {',
        '  eq: MyScalar',
        '  in: [MyScalar!]',
        '  exists: Boolean',
        '}',
      ].join('\n')
    );
  });

  it('should name the input after the scalar', () => {
    // Arrange
    const scalar: ScalarDetail = {
      scalarName: 'AWSDateTime',
      javascriptType: 'string',
      filtersAvailable: [PossibleFilters.eq],
    };

    // Act
    const result = convertScalarDetailToScalarFilterInput(scalar);

    // Assert
    expect(print(result)).toContain('input AWSDateTimeInput {');
  });
});
