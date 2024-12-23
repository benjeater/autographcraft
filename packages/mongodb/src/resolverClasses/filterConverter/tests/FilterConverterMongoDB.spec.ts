import { jest, describe, expect, beforeEach, it } from '@jest/globals';
import {
  getDefaultParams,
  getEqualOnlyParams,
  getNotEqualOnlyParams,
  getLessThanOnlyParams,
  getLessThanOrEqualOnlyParams,
  getGreaterThanOnlyParams,
  getGreaterThanOrEqualOnlyParams,
  getInOnlyParams,
  getNotInOnlyParams,
  getBetweenOnlyParams,
  getStartsWithOnlyParams,
  getExistsOnlyParams,
  getCombinationFilter,
  getAndOnlyParams,
  getNestedAndOnlyParams,
  getOrOnlyParams,
  getNotOnlyParams,
  getFilterWithIdParams,
} from './FilterConverterMongoDB.data';

import { FilterConverterMongoDB } from '../FilterConverterMongoDB';

let instance: FilterConverterMongoDB;

describe('FilterConverterMongoDB', () => {
  beforeEach(() => {
    instance = new FilterConverterMongoDB(getDefaultParams());
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(FilterConverterMongoDB).toBeDefined();
  });

  it('should have a convert method', () => {
    expect(instance.convert).toBeDefined();
  });

  it('should return an empty object if no filter is provided', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getDefaultParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({});
  });

  it('should convert an equal filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getEqualOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $eq: '2024-01-01T00:00:00.000Z',
      },
    });
  });

  it('should convert a not equal filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getNotEqualOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $ne: '2024-01-01T00:00:00.000Z',
      },
    });
  });

  it('should convert a less than filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getLessThanOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $lt: '2024-01-01T00:00:00.000Z',
      },
    });
  });

  it('should convert a less than or equal filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getLessThanOrEqualOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $lte: '2024-01-01T00:00:00.000Z',
      },
    });
  });

  it('should convert a greater than filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getGreaterThanOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $gt: '2024-01-01T00:00:00.000Z',
      },
    });
  });

  it('should convert a greater than or equal filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getGreaterThanOrEqualOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $gte: '2024-01-01T00:00:00.000Z',
      },
    });
  });

  it('should convert an in filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getInOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $in: ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'],
      },
    });
  });

  it('should convert a not in filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getNotInOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $nin: ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'],
      },
    });
  });

  it('should convert a between filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getBetweenOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $gte: '2024-01-01T00:00:00.000Z',
        $lte: '2024-01-02T00:00:00.000Z',
      },
    });
  });

  it('should convert a starts with filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getStartsWithOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      name: {
        $eq: new RegExp(`^test.*`, 'i'),
      },
    });
  });

  it('should convert an exists filter correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getExistsOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      name: {
        $exists: true,
      },
    });
  });

  it('should convert a combination of filters correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getCombinationFilter());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      startDate: {
        $eq: '2024-01-01T00:00:00.000Z',
        $lt: '2024-01-02T00:00:00.000Z',
      },
      name: {
        $eq: new RegExp(`^test.*`, 'i'),
        $exists: true,
      },
    });
  });

  it('should convert a filter with an AND operator correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getAndOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      $and: [
        {
          startDate: {
            $eq: '2024-01-01T00:00:00.000Z',
          },
          endDate: {
            $gt: '2024-01-01T00:00:00.000Z',
          },
        },
        {
          endDate: {
            $lt: '2024-01-02T00:00:00.000Z',
          },
        },
      ],
    });
  });

  it('should convert a nested filter with an AND operator correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getNestedAndOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      $and: [
        {
          $and: [
            {
              startDate: {
                $eq: '2024-01-01T00:00:00.000Z',
              },
            },
            {
              endDate: {
                $gt: '2024-01-01T00:00:00.000Z',
              },
            },
          ],
        },
        {
          status: {
            $eq: 'active',
          },
        },
      ],
    });
  });

  it('should convert a filter with an OR operator correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getOrOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      $or: [
        {
          startDate: {
            $eq: '2024-01-01T00:00:00.000Z',
          },
          endDate: {
            $gt: '2024-01-01T00:00:00.000Z',
          },
        },
        {
          endDate: {
            $lt: '2024-01-02T00:00:00.000Z',
          },
        },
      ],
    });
  });

  it('should convert a filter with a NOT operator correctly', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getNotOnlyParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      $not: {
        startDate: {
          $eq: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          $gt: '2024-01-01T00:00:00.000Z',
        },
      },
    });
  });

  it('should convert the id field to _id', () => {
    // Arrange
    instance = new FilterConverterMongoDB(getFilterWithIdParams());

    // Act
    const result = instance.convert();

    // Assert
    expect(result).toEqual({
      _id: {
        $eq: '12345',
      },
    });
  });

  it('should throw an error if an unknown filter operator is provided', () => {
    // Arrange
    instance = new FilterConverterMongoDB({
      ...getFilterWithIdParams(),
      filter: {
        startDate: {
          $unknown: '2024-01-01T00:00:00.000Z',
        },
      },
    });

    // Act
    const result = () => instance.convert();

    // Assert
    expect(result).toThrowError(
      'No filter class found for filter operator: $unknown on field: startDate'
    );
  });
});
