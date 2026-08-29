import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  DEFAULT_VALUES,
  getAuthorisationParamsWithoutLogger,
  getAuthorisationParamsWithUnsupportedDatabase,
  getDefaultAuthorisationParams,
  mongooseConnectionModelFind,
  mongooseConnectionModelFindById,
  // getDefaultContext,
  // getDefaultParentDefinitionNode,
  // getListDefinitionNode,
  // getNonScalarDefinitionNode,
  // getScalarDefinitionNode,
} from './AutoGraphCraftAuthorisation.data';

import { AutoGraphCraftAuthorisation } from '../AutoGraphCraftAuthorisation';
import type { AutoGraphCraftAuthorisationParams } from '../types';

let classInstance: AutoGraphCraftAuthorisation;
let params: AutoGraphCraftAuthorisationParams;

describe('AutoGraphCraftAuthorisation', () => {
  beforeEach(() => {
    params = getDefaultAuthorisationParams();
    classInstance = new AutoGraphCraftAuthorisation(params);
  });

  it('should be defined', () => {
    expect(AutoGraphCraftAuthorisation).toBeDefined();
  });

  it('should be able to be instantiated', () => {
    expect(classInstance).toBeDefined();
  });

  describe('initialise', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should log some info if not initialised with the correct ids', async () => {
      await classInstance.initialise({});
      expect(params.logger!.info).toHaveBeenCalledTimes(1);
      expect(params.logger!.info).toHaveBeenCalledWith(
        'The following root ids are missing when initialising AutoGraphCraftAuthorisation: TestModel'
      );
    });

    it('should load data from the database for a single root id with no joins', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(mongooseConnectionModelFindById).toHaveBeenCalledTimes(0);
      expect(classInstance.getAuthIdsForModel('TestModel')).toEqual(['1']);
    });

    it('should load data from the database for multiple root ids with no joins', async () => {
      const params = getDefaultAuthorisationParams();
      params.authorisationStructure.push({
        targetModelName: 'TestModel2',
        joins: [],
      });
      classInstance = new AutoGraphCraftAuthorisation(params);
      await classInstance.initialise({
        rootIds: { TestModel: '1', TestModel2: '2' },
      });
      expect(mongooseConnectionModelFindById).toHaveBeenCalledTimes(0);
      expect(classInstance.getAuthIdsForModel('TestModel')).toEqual(['1']);
      expect(classInstance.getAuthIdsForModel('TestModel2')).toEqual(['2']);
    });

    it('should load data from the database for a single root id with joins', async () => {
      // Arrange
      const params = getDefaultAuthorisationParams();
      params.authorisationStructure[0].joins = [
        {
          sourceJoinType: 'hasMany',
          sourceIdFieldName: DEFAULT_VALUES.fieldName,
          targetModelName: DEFAULT_VALUES.targetModelName,
          targetModelIdFieldName: DEFAULT_VALUES.targetModelIdFieldName,
          joins: [],
        },
      ];
      classInstance = new AutoGraphCraftAuthorisation(params);
      mongooseConnectionModelFindById.mockReturnValue({
        _id: '1',
        id: '1',
        [DEFAULT_VALUES.fieldName]: '3',
        get: () => '1', // return the id
      });
      mongooseConnectionModelFind.mockReturnValue([
        {
          _id: '3',
          id: '3',
          [DEFAULT_VALUES.targetModelIdFieldName]: '1',
          get: () => '3', // return the id
        },
      ]);

      // Act
      await classInstance.initialise({ rootIds: { TestModel: '1' } });

      // Assert
      expect(mongooseConnectionModelFindById).toHaveBeenCalledTimes(1);
      expect(mongooseConnectionModelFindById).toHaveBeenCalledWith('1');
      expect(mongooseConnectionModelFind).toHaveBeenCalledTimes(1);
      expect(
        classInstance.getAuthIdsForModel(DEFAULT_VALUES.testModel)
      ).toEqual(['1']);
      expect(classInstance.getAuthIdsForModel('TestModel2')).toEqual([]);
      expect(
        classInstance.getAuthIdsForModel(DEFAULT_VALUES.targetModelName)
      ).toEqual(['3']);
    });

    it('should load data from the database for multiple root ids with multiple joins', async () => {
      // Arrange
      const params = getDefaultAuthorisationParams();
      params.authorisationStructure[0].joins = [
        {
          sourceJoinType: 'hasMany',
          sourceIdFieldName: DEFAULT_VALUES.fieldName,
          targetModelName: DEFAULT_VALUES.targetModelName,
          targetModelIdFieldName: DEFAULT_VALUES.targetModelIdFieldName,
          joins: [],
        },
      ];
      params.authorisationStructure.push({
        targetModelName: 'TestModel2',
        joins: [
          {
            sourceJoinType: 'hasMany',
            sourceIdFieldName: DEFAULT_VALUES.fieldName,
            targetModelName: DEFAULT_VALUES.targetModelNameTwo,
            targetModelIdFieldName: DEFAULT_VALUES.targetModelIdFieldNameTwo,
            joins: [],
          },
        ],
      });
      classInstance = new AutoGraphCraftAuthorisation(params);
      mongooseConnectionModelFindById.mockReturnValue({
        _id: '1',
        id: '1',
        [DEFAULT_VALUES.fieldName]: '3',
        get: () => '1', // return the id
      });
      mongooseConnectionModelFind.mockReturnValue([
        {
          _id: '3',
          id: '3',
          [DEFAULT_VALUES.targetModelIdFieldName]: '1',
          get: () => '3', // return the id
        },
      ]);

      // Act
      await classInstance.initialise({
        rootIds: { TestModel: '1', TestModel2: '2' },
      });

      // Assert
      expect(mongooseConnectionModelFindById).toHaveBeenCalledTimes(2);
      expect(mongooseConnectionModelFindById).toHaveBeenCalledWith('1');
      expect(mongooseConnectionModelFindById).toHaveBeenCalledWith('2');
      expect(mongooseConnectionModelFind).toHaveBeenCalledTimes(2);
      expect(
        classInstance.getAuthIdsForModel(DEFAULT_VALUES.testModel)
      ).toEqual(['1']);
      expect(classInstance.getAuthIdsForModel('TestModel2')).toEqual(['2']);
      expect(
        classInstance.getAuthIdsForModel(DEFAULT_VALUES.targetModelName)
      ).toEqual(['3']);
      expect(
        classInstance.getAuthIdsForModel(DEFAULT_VALUES.targetModelNameTwo)
      ).toEqual(['3']);
    });
  });

  describe('initialiseWithCachedData', () => {
    it('should initialise with cached data', async () => {
      const data = {
        allAuthIds: [
          'TestModel::1',
          'TestModel::2',
          'TestModel::3',
          'OtherTestModel::1',
        ],
      };
      await classInstance.initialiseWithCachedData(data);
      expect(classInstance.getAuthIdsForModel('TestModel')).toEqual([
        '1',
        '2',
        '3',
      ]);
      expect(classInstance.getAuthIdsForModel('OtherTestModel')).toEqual(['1']);
    });
  });

  describe('hasAuthIdsForModel', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it('should return true if the model is "public"', async () => {
      await classInstance.initialise({});
      expect(classInstance.hasAuthIdsForModel('public')).toBeTruthy();
    });

    it('should return false if the model is "signedIn" and the user is not signed in', async () => {
      await classInstance.initialise({});
      expect(classInstance.hasAuthIdsForModel('signedIn')).toBeFalsy();
    });

    it('should return true if the model is "signedIn" and the user is signed in', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(classInstance.hasAuthIdsForModel('signedIn')).toBeTruthy();
    });

    it('should return false if the model is "admin" and the user is not signed in', async () => {
      await classInstance.initialise({});
      expect(classInstance.hasAuthIdsForModel('admin')).toBeFalsy();
    });

    it('should return false if the model is "admin" and the user is signed in but not an admin', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(classInstance.hasAuthIdsForModel('admin')).toBeFalsy();
    });

    it('should return true if the model is "admin" and the user is signed in and an admin', async () => {
      await classInstance.initialise({
        rootIds: { TestModel: '1' },
        isAdmin: true,
      });
      expect(classInstance.hasAuthIdsForModel('admin')).toBeTruthy();
    });

    it('should return true if there are auth ids for the model', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(
        classInstance.hasAuthIdsForModel(DEFAULT_VALUES.testModel)
      ).toBeTruthy();
    });

    it('should return false if there are no auth ids for the model', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(classInstance.hasAuthIdsForModel('OtherTestModel')).toBeFalsy();
    });
  });

  describe('documentAuthorisation', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it('should return true if the model is "public"', async () => {
      await classInstance.initialise({});
      expect(classInstance.documentAuthorisation('public')).toBeTruthy();
    });

    it('should return false if the model is "signedIn" and the user is not signed in', async () => {
      await classInstance.initialise({});
      expect(classInstance.documentAuthorisation('signedIn')).toBeFalsy();
    });

    it('should return true if the model is "signedIn" and the user is signed in', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(classInstance.documentAuthorisation('signedIn')).toBeTruthy();
    });

    it('should return false if the model is "admin" and the user is not signed in', async () => {
      await classInstance.initialise({});
      expect(classInstance.documentAuthorisation('admin')).toBeFalsy();
    });

    it('should return false if the model is "admin" and the user is signed in but not an admin', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(classInstance.documentAuthorisation('admin')).toBeFalsy();
    });

    it('should return true if the model is "admin" and the user is signed in and an admin', async () => {
      await classInstance.initialise({
        rootIds: { TestModel: '1' },
        isAdmin: true,
      });
      expect(classInstance.documentAuthorisation('admin')).toBeTruthy();
    });

    it('should return true if the user is signed in and the document is in the auth ids', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(
        classInstance.documentAuthorisation('TestModel', '1')
      ).toBeTruthy();
    });

    it('should return false if the user is signed in and the document is not in the auth ids', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(classInstance.documentAuthorisation('TestModel', '2')).toBeFalsy();
    });

    it('should return false if the user is signed in and the document is in the auth ids but for a different model', async () => {
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      expect(
        classInstance.documentAuthorisation('OtherTestModel', '1')
      ).toBeFalsy();
    });
  });

  describe('getCacheableData', () => {
    it('should return all the auth ids that were loaded', async () => {
      // Arrange
      await classInstance.initialise({ rootIds: { TestModel: '1' } });

      // Act
      const result = classInstance.getCacheableData();

      // Assert
      expect(result).toEqual({
        allAuthIds: ['TestModel::1'],
        rootIds: { TestModel: '1' },
        isAdmin: false,
      });
    });

    it('should return the same data that it was initialised with from the cache', async () => {
      // Arrange
      const data = {
        allAuthIds: ['TestModel::1', 'OtherTestModel::2'],
        rootIds: { TestModel: '1' },
        isAdmin: false,
      };
      await classInstance.initialiseWithCachedData(data);

      // Act
      const result = classInstance.getCacheableData();

      // Assert
      expect(result).toEqual(data);
    });

    it('should carry the admin flag through the cache', async () => {
      // Arrange
      await classInstance.initialise({
        rootIds: { TestModel: '1' },
        isAdmin: true,
      });

      // Act
      const result = classInstance.getCacheableData();

      // Assert
      expect(result).toEqual({
        allAuthIds: ['TestModel::1'],
        rootIds: { TestModel: '1' },
        isAdmin: true,
      });
    });
  });

  describe('authorisation without a document id', () => {
    // `convertAuthIdToAuthFormat` used to substitute an `ANY_ID` placeholder for
    // a missing id on both the storage and the lookup side, so a root id that
    // was never provided produced the very key that a no-id lookup searched
    // for - a missing root id granted a match instead of denying one.
    it('should not authorise a normal model when no document id is given', async () => {
      // Arrange
      await classInstance.initialise({ rootIds: { TestModel: '1' } });

      // Act / Assert
      expect(classInstance.documentAuthorisation('TestModel')).toBe(false);
      expect(classInstance.documentAuthorisation('TestModel', '1')).toBe(true);
    });

    it('should not authorise anything for a root id that was not provided', async () => {
      // Arrange
      await classInstance.initialise({ rootIds: { TestModel: '' } });

      // Act / Assert
      expect(classInstance.documentAuthorisation('TestModel')).toBe(false);
      expect(classInstance.getAuthIdsForModel('TestModel')).toEqual([]);
      expect(classInstance.hasAuthIdsForModel('TestModel')).toBe(false);
      expect(classInstance.getCacheableData().allAuthIds).toEqual([]);
    });

    it('should still authorise the special models that take no id', async () => {
      // Arrange
      await classInstance.initialise({
        rootIds: { TestModel: '1' },
        isAdmin: true,
      });

      // Act / Assert
      expect(classInstance.documentAuthorisation('public')).toBe(true);
      expect(classInstance.documentAuthorisation('signedIn')).toBe(true);
      expect(classInstance.documentAuthorisation('admin')).toBe(true);
    });
  });

  describe('round trip through the cache', () => {
    // `rootIds` and `isAdmin` back the `signedIn` and `admin` checks. When
    // `getCacheableData` dropped them, a caller authorised before caching was
    // refused after it.
    it('should still report a signed in caller as signed in', async () => {
      // Arrange
      await classInstance.initialise({ rootIds: { TestModel: '1' } });
      const cached = classInstance.getCacheableData();
      const restored = new AutoGraphCraftAuthorisation(
        getDefaultAuthorisationParams()
      );

      // Act
      await restored.initialiseWithCachedData(cached);

      // Assert
      expect(restored.hasAuthIdsForModel('signedIn')).toBe(true);
      expect(restored.documentAuthorisation('signedIn')).toBe(true);
    });

    it('should still report an admin caller as an admin', async () => {
      // Arrange
      await classInstance.initialise({
        rootIds: { TestModel: '1' },
        isAdmin: true,
      });
      const cached = classInstance.getCacheableData();
      const restored = new AutoGraphCraftAuthorisation(
        getDefaultAuthorisationParams()
      );

      // Act
      await restored.initialiseWithCachedData(cached);

      // Assert
      expect(restored.hasAuthIdsForModel('admin')).toBe(true);
      expect(restored.documentAuthorisation('admin')).toBe(true);
    });

    it('should skip an auth id that has no separator rather than storing undefined', async () => {
      // Arrange
      // Nothing the package builds looks like this, but the ids come in from a
      // cache, so a malformed entry must not put `undefined` into a string[].
      const entry = { allAuthIds: ['TestModel::1', 'MalformedModel'] };

      // Act
      await classInstance.initialiseWithCachedData(entry);

      // Assert
      expect(classInstance.getAuthIdsForModel('TestModel')).toEqual(['1']);
      expect(classInstance.getAuthIdsForModel('MalformedModel')).toEqual([]);
      expect(classInstance.hasAuthIdsForModel('MalformedModel')).toBe(false);
    });

    it('should treat a cache entry written before rootIds and isAdmin existed as anonymous', async () => {
      // Arrange
      const legacyEntry = { allAuthIds: ['TestModel::1'] };

      // Act
      await classInstance.initialiseWithCachedData(legacyEntry);

      // Assert
      expect(classInstance.hasAuthIdsForModel('signedIn')).toBe(false);
      expect(classInstance.hasAuthIdsForModel('admin')).toBe(false);
      expect(classInstance.getAuthIdsForModel('TestModel')).toEqual(['1']);
    });
  });

  describe('when the class has not been initialised', () => {
    it('should throw when getCacheableData is called', () => {
      expect(() => classInstance.getCacheableData()).toThrow(
        'AutoGraphCraftAuthorisation is not initialised'
      );
    });

    it('should throw when hasAuthIdsForModel is called', () => {
      expect(() =>
        classInstance.hasAuthIdsForModel(DEFAULT_VALUES.testModel)
      ).toThrow('AutoGraphCraftAuthorisation is not initialised');
    });

    it('should throw when documentAuthorisation is called', () => {
      expect(() =>
        classInstance.documentAuthorisation(DEFAULT_VALUES.testModel, '1')
      ).toThrow('AutoGraphCraftAuthorisation is not initialised');
    });

    it('should throw when getAuthIdsForModel is called', () => {
      expect(() =>
        classInstance.getAuthIdsForModel(DEFAULT_VALUES.testModel)
      ).toThrow('AutoGraphCraftAuthorisation is not initialised');
    });
  });

  describe('when the database type is not supported', () => {
    it('should throw when initialise is called', async () => {
      // Arrange
      classInstance = new AutoGraphCraftAuthorisation(
        getAuthorisationParamsWithUnsupportedDatabase()
      );

      // Act / Assert
      await expect(
        classInstance.initialise({ rootIds: { TestModel: '1' } })
      ).rejects.toThrow('Database type DYNAMO_DB not supported');
    });
  });

  describe('when no logger is provided', () => {
    beforeEach(() => {
      classInstance = new AutoGraphCraftAuthorisation(
        getAuthorisationParamsWithoutLogger()
      );
    });

    it('should initialise without a logger when root ids are missing', async () => {
      await expect(classInstance.initialise({})).resolves.toBeUndefined();
    });

    it('should authorise a document without a logger', async () => {
      // Arrange
      await classInstance.initialise({ rootIds: { TestModel: '1' } });

      // Act / Assert
      expect(
        classInstance.documentAuthorisation(DEFAULT_VALUES.testModel, '1')
      ).toBeTruthy();
      expect(
        classInstance.documentAuthorisation(DEFAULT_VALUES.testModel, '2')
      ).toBeFalsy();
    });
  });
});
