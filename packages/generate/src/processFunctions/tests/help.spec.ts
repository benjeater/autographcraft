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

  it('should wait for the browser to be opened before resolving', async () => {
    // Arrange
    // The caller exits the process as soon as `help` resolves, so it must not
    // resolve before `open` has spawned the browser.
    let spawnBrowser: (() => void) | undefined;
    open.mockReturnValueOnce(
      new Promise<unknown>((resolve) => {
        spawnBrowser = () => resolve(undefined);
      })
    );
    let hasResolved = false;

    // Act
    const helpPromise = help().then(() => {
      hasResolved = true;
    });
    await Promise.resolve();

    // Assert
    expect(hasResolved).toBe(false);
    spawnBrowser?.();
    await helpPromise;
    expect(hasResolved).toBe(true);
  });

  it('should propagate a failure to open the browser', async () => {
    // Arrange
    const error = new Error('no browser available');
    open.mockRejectedValueOnce(error);

    // Act / Assert
    await expect(help()).rejects.toThrow(error);
  });
});
