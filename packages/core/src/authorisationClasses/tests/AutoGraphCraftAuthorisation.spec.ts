/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  DEFAULT_VALUES,
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
});
