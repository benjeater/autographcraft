import { jest, beforeEach, describe, expect, it } from '@jest/globals';
import type { AutoGraphCraftConfigurationField } from '@autographcraft/core';

// ESM has no automocking, so the prompt this module uses is named explicitly.
// A real prompt would block the test run waiting for stdin.
const confirm =
  jest.fn<
    (config: { message: string; default?: boolean }) => Promise<boolean>
  >();

jest.unstable_mockModule('@inquirer/prompts', () => ({ confirm }));

const {
  questionSetConfigurationValueConfirmation,
  questionSetConfigurationValueToDefaultConfirmation,
} = await import('../questions');

const KEY = 'databaseType' as AutoGraphCraftConfigurationField;

describe('configFunctions/questions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    confirm.mockResolvedValue(true);
  });

  describe('questionSetConfigurationValueConfirmation', () => {
    it('should ask the user to confirm the key and value, defaulting to yes', async () => {
      // Act
      const result = await questionSetConfigurationValueConfirmation(
        KEY,
        'MONGO_DB'
      );

      // Assert
      expect(result).toBe(true);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(confirm).toHaveBeenCalledWith({
        message: 'Would you like to set the databaseType setting to MONGO_DB?',
        default: true,
      });
    });

    it('should return the negative answer given by the user', async () => {
      // Arrange
      confirm.mockResolvedValueOnce(false);

      // Act
      const result = await questionSetConfigurationValueConfirmation(
        KEY,
        'MONGO_DB'
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('questionSetConfigurationValueToDefaultConfirmation', () => {
    it('should ask the user to confirm the key, defaulting to yes', async () => {
      // Act
      const result =
        await questionSetConfigurationValueToDefaultConfirmation(KEY);

      // Assert
      expect(result).toBe(true);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(confirm).toHaveBeenCalledWith({
        message:
          'Would you like to set the databaseType setting to the default value?',
        default: true,
      });
    });

    it('should return the negative answer given by the user', async () => {
      // Arrange
      confirm.mockResolvedValueOnce(false);

      // Act
      const result =
        await questionSetConfigurationValueToDefaultConfirmation(KEY);

      // Assert
      expect(result).toBe(false);
    });
  });
});
