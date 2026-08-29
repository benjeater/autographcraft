import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import { getExistingConfiguration } from './validateAuthConfiguration.data';

// ESM has no automocking, so the parts of core this unit touches are named
// explicitly, and the unit under test is imported after the mock is registered.
jest.unstable_mockModule('@autographcraft/core', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

const { logger } = await import('@autographcraft/core');
const { validateAuthConfiguration } =
  await import('../validateAuthConfiguration');

describe('validateAuthConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should give a warning if the auth configuration is not provided', () => {
    validateAuthConfiguration();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      '⚠️ The authorisation structure is empty; please ensure this is correct (i.e. all auth rules are public or signedIn)'
    );
  });

  it('should give a warning if the auth configuration is empty', () => {
    validateAuthConfiguration([]);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      '⚠️ The authorisation structure is empty; please ensure this is correct (i.e. all auth rules are public or signedIn)'
    );
  });

  it('should give a warning if the auth configuration has duplicated model names', () => {
    // arrange
    const existingConfiguration = getExistingConfiguration();
    existingConfiguration.push(existingConfiguration[0]);

    // act
    validateAuthConfiguration(existingConfiguration);

    // assert
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      '⚠️ The authorisation structure contains duplicated model names; please ensure this is correct'
    );
  });

  it('should validate the auth configuration without warning', () => {
    const existingConfiguration = getExistingConfiguration();
    validateAuthConfiguration(existingConfiguration);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
