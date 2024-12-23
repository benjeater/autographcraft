import { validateAuthConfiguration } from '../validateAuthConfiguration';
import { getExistingConfiguration } from './validateAuthConfiguration.data';
import { logger } from '@autographcraft/core';

jest.mock('@autographcraft/core');

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
