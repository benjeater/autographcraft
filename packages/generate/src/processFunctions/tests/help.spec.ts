import { jest, beforeEach, describe, expect, it } from '@jest/globals';

// ESM has no automocking, so `open` is named explicitly and the unit under
// test is imported after the mock is registered. Opening a real browser from
// a test run would be neither hermetic nor fast.
const open = jest.fn<(target: string) => Promise<unknown>>();

jest.unstable_mockModule('open', () => ({ default: open }));

const { help } = await import('../help');

describe('help', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    open.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    // Assert
    expect(help).toBeDefined();
  });

  it('should open the readme documentation in the default browser', async () => {
    // Act
    await help();

    // Assert
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      'https://github.com/benjeater/autographcraft#readme'
    );
  });

  it('should resolve without waiting for the browser to open', async () => {
    // Arrange
    // `help` does not await `open`, so a never-settling call must not hang it
    open.mockReturnValueOnce(new Promise<unknown>(() => {}));

    // Act
    const result = await help();

    // Assert
    expect(result).toBeUndefined();
  });
});
