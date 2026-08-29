import { jest, beforeEach, describe, it, expect } from '@jest/globals';

import {
  getDefaultParamsHasOne,
  getDefaultParamsHasMany,
  getDefaultParamsHasManyWithJoins,
  getParamsWithMissingRootDocument,
  getParamsWithNoAuthStructureForRootModel,
  getParamsWithNoJoins,
  getParamsWithUnknownJoinType,
  DEFAULT_IDS,
  UNKNOWN_JOIN_TYPE,
} from './loadMongoDbDataFromDatabase.data';

import { loadMongoDbDataFromDatabase } from '../loadMongoDbDataFromDatabase';

describe('loadMongoDbDataFromDatabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(loadMongoDbDataFromDatabase).toBeDefined();
  });

  it('should return an array of strings for a hasOne join', async () => {
    const params = getDefaultParamsHasOne();
    const rootIds = {
      RootModel: DEFAULT_IDS.RootModel,
    };

    const result = await loadMongoDbDataFromDatabase(params, rootIds);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
    expect(result).toEqual(
      new Set([
        `RootModel::${DEFAULT_IDS.RootModel}`,
        `TargetModelHasOne::${DEFAULT_IDS.TargetModelOne}`,
      ])
    );
  });

  it('should return an array of strings for a hasMany join', async () => {
    const params = getDefaultParamsHasMany();
    const rootIds = {
      RootModel: DEFAULT_IDS.RootModel,
    };

    const result = await loadMongoDbDataFromDatabase(params, rootIds);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(3);
    expect(result).toEqual(
      new Set([
        `RootModel::${DEFAULT_IDS.RootModel}`,
        `TargetModelHasMany::${DEFAULT_IDS.TargetModelOne}`,
        `TargetModelHasMany::${DEFAULT_IDS.TargetModelTwo}`,
      ])
    );
  });

  it('should return an array of strings for a hasMany join with depth of three (root, join with joins)', async () => {
    const params = getDefaultParamsHasManyWithJoins();
    const rootIds = {
      RootModel: DEFAULT_IDS.RootModel,
    };

    const result = await loadMongoDbDataFromDatabase(params, rootIds);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(6);
    expect(result).toEqual(
      new Set([
        `RootModel::${DEFAULT_IDS.RootModel}`,
        `TargetModelHasMany::${DEFAULT_IDS.TargetModelOne}`,
        `TargetModelHasMany::${DEFAULT_IDS.TargetModelTwo}`,
        `TargetModelHasManyChild::${DEFAULT_IDS.TargetModelThree}`,
        `TargetModelHasManyChild::${DEFAULT_IDS.TargetModelFour}`,
        `TargetModelHasManyChild::${DEFAULT_IDS.TargetModelFive}`,
      ])
    );
  });

  it('should return only the root auth id when there is no authorisation structure for the root model', async () => {
    // Arrange
    const params = getParamsWithNoAuthStructureForRootModel();
    const rootIds = {
      RootModel: DEFAULT_IDS.RootModel,
    };

    // Act
    const result = await loadMongoDbDataFromDatabase(params, rootIds);

    // Assert
    expect(result).toEqual(new Set([`RootModel::${DEFAULT_IDS.RootModel}`]));
    expect(params.mongooseConnection.model).not.toHaveBeenCalled();
  });

  it('should return only the root auth id when the authorisation structure has no joins', async () => {
    // Arrange
    const params = getParamsWithNoJoins();
    const rootIds = {
      RootModel: DEFAULT_IDS.RootModel,
    };

    // Act
    const result = await loadMongoDbDataFromDatabase(params, rootIds);

    // Assert
    expect(result).toEqual(new Set([`RootModel::${DEFAULT_IDS.RootModel}`]));
    expect(params.mongooseConnection.model).not.toHaveBeenCalled();
  });

  it('should return only the root auth id when the root document cannot be found', async () => {
    // Arrange
    const params = getParamsWithMissingRootDocument();
    const rootIds = {
      RootModel: DEFAULT_IDS.RootModel,
    };

    // Act
    const result = await loadMongoDbDataFromDatabase(params, rootIds);

    // Assert
    expect(result).toEqual(new Set([`RootModel::${DEFAULT_IDS.RootModel}`]));
    expect(params.mongooseConnection.model).toHaveBeenCalledTimes(1);
    expect(params.mongooseConnection.model).toHaveBeenCalledWith('RootModel');
  });

  it('should throw an error when the join type is not supported', async () => {
    // Arrange
    const params = getParamsWithUnknownJoinType();
    const rootIds = {
      RootModel: DEFAULT_IDS.RootModel,
    };

    // Act / Assert
    await expect(loadMongoDbDataFromDatabase(params, rootIds)).rejects.toThrow(
      `Unknown join type: ${UNKNOWN_JOIN_TYPE}`
    );
  });
});
