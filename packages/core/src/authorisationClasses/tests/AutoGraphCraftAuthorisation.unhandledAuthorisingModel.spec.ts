import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  getAuthorisationParamsWithoutLogger,
  getDefaultAuthorisationParams,
} from './AutoGraphCraftAuthorisation.data';
import type { AutoGraphCraftAuthorisationParams } from '../types';

// Every name in AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD has a dedicated
// handler in the class, so the defensive branch that warns about an unhandled
// name can only be reached by adding a name to that list. ESM has no
// automocking, so the constants module is mocked with its real exports plus the
// extra name, and the class is imported after the mock is registered.
const UNHANDLED_MODEL_NAME = 'unhandledAuthorisingModel';

const actualConstants = await import('../../constants');

jest.unstable_mockModule('../../constants', () => ({
  ...actualConstants,
  AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD: [
    ...actualConstants.AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD,
    UNHANDLED_MODEL_NAME,
  ],
}));

const { AutoGraphCraftAuthorisation } =
  await import('../AutoGraphCraftAuthorisation');

let classInstance: InstanceType<typeof AutoGraphCraftAuthorisation>;
let params: AutoGraphCraftAuthorisationParams;

describe('AutoGraphCraftAuthorisation - unhandled authorising model', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    params = getDefaultAuthorisationParams();
    classInstance = new AutoGraphCraftAuthorisation(params);
    await classInstance.initialise({ rootIds: { TestModel: '1' } });
  });

  it('should refuse hasAuthIdsForModel and warn that the model is not handled', () => {
    // Act
    const result = classInstance.hasAuthIdsForModel(UNHANDLED_MODEL_NAME);

    // Assert
    expect(result).toBe(false);
    expect(params.logger!.warn).toHaveBeenCalledTimes(1);
    expect(params.logger!.warn).toHaveBeenCalledWith(
      `Model name ${UNHANDLED_MODEL_NAME} is not handled even though it is in the AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD array`
    );
  });

  it('should refuse documentAuthorisation and warn that the model is not handled', () => {
    // Act
    const result = classInstance.documentAuthorisation(
      UNHANDLED_MODEL_NAME,
      '1'
    );

    // Assert
    expect(result).toBe(false);
    expect(params.logger!.warn).toHaveBeenCalledTimes(1);
    expect(params.logger!.warn).toHaveBeenCalledWith(
      `Model name ${UNHANDLED_MODEL_NAME} is not handled even though it is in the AUTHORISING_MODEL_NAMES_WITHOUT_ID_FIELD array`
    );
  });

  it('should refuse the model when no logger is provided', async () => {
    // Arrange
    classInstance = new AutoGraphCraftAuthorisation(
      getAuthorisationParamsWithoutLogger()
    );
    await classInstance.initialise({ rootIds: { TestModel: '1' } });

    // Act / Assert
    expect(classInstance.hasAuthIdsForModel(UNHANDLED_MODEL_NAME)).toBe(false);
  });
});
