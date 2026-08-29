import { jest, beforeEach, describe, expect, it } from '@jest/globals';

// ESM has no automocking, so every member of `@inquirer/prompts` that the
// questions module reaches for is named explicitly, and the unit under test is
// imported after the mocks are registered.
const confirm =
  jest.fn<
    (config: { message: string; default?: boolean }) => Promise<boolean>
  >();
const input = jest.fn<(config: { message: string }) => Promise<string>>();
const password = jest.fn<(config: { message: string }) => Promise<string>>();

jest.unstable_mockModule('@inquirer/prompts', () => ({
  confirm,
  input,
  password,
}));

const { questionHasAccount, questionUsername, questionPassword } =
  await import('../index');

describe('questions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('questionHasAccount', () => {
    it('should ask whether the user has an account and default to false', async () => {
      // Arrange
      confirm.mockResolvedValueOnce(true);

      // Act
      const result = await questionHasAccount();

      // Assert
      expect(result).toBe(true);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(confirm).toHaveBeenCalledWith({
        message: 'Have you already signed up for an autographcraft account?',
        default: false,
      });
    });

    it('should return the negative answer from the user', async () => {
      // Arrange
      confirm.mockResolvedValueOnce(false);

      // Act
      const result = await questionHasAccount();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('questionUsername', () => {
    it('should ask for the username and return the answer', async () => {
      // Arrange
      input.mockResolvedValueOnce('test-user');

      // Act
      const result = await questionUsername();

      // Assert
      expect(result).toBe('test-user');
      expect(input).toHaveBeenCalledTimes(1);
      expect(input).toHaveBeenCalledWith({ message: 'Username:' });
    });
  });

  describe('questionPassword', () => {
    it('should ask for the password using the masked prompt and return the answer', async () => {
      // Arrange
      password.mockResolvedValueOnce('test-password');

      // Act
      const result = await questionPassword();

      // Assert
      expect(result).toBe('test-password');
      expect(password).toHaveBeenCalledTimes(1);
      expect(password).toHaveBeenCalledWith({ message: 'Password:' });
    });
  });
});
