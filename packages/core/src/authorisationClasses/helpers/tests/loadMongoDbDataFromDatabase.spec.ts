import { jest, beforeEach, describe, it, expect } from '@jest/globals';

import {
  getDefaultParamsHasOne,
  getDefaultParamsHasMany,
  getDefaultParamsHasManyWithJoins,
  DEFAULT_IDS,
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
});
