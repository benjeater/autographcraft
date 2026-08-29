import {
  jest,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  PROCESS_ARGUMENT_PARAMS,
  PROCESS_ARGUMENT_VECTORS,
} from '../constants';
import type { ProcessFunctionParams } from '../types';

const CURRENT_WORKING_DIRECTORY = '/home/user/project';

// ESM has no automocking, so everything the entry point dispatches to is
// replaced explicitly: no arguments are parsed, no process function runs and
// nothing is logged to the real logger.
const getParams = jest.fn<() => ProcessFunctionParams>();
const init =
  jest.fn<(cwd: string, params: ProcessFunctionParams) => Promise<void>>();
const config =
  jest.fn<(cwd: string, params: ProcessFunctionParams) => Promise<void>>();
const help =
  jest.fn<(cwd: string, params: ProcessFunctionParams) => Promise<void>>();
const generateAndSave =
  jest.fn<(cwd: string, params: ProcessFunctionParams) => Promise<void>>();

const logger = {
  silent: false,
  warn: jest.fn<(message: unknown) => void>(),
  error: jest.fn<(message: unknown) => void>(),
  end: jest.fn<() => void>(),
};

jest.unstable_mockModule('../helpers', () => ({ getParams }));
jest.unstable_mockModule('../processFunctions/init', () => ({ init }));
jest.unstable_mockModule('../processFunctions/config', () => ({ config }));
jest.unstable_mockModule('../processFunctions/help', () => ({ help }));
jest.unstable_mockModule('../processFunctions/generateAndSave', () => ({
  generateAndSave,
}));
jest.unstable_mockModule('@autographcraft/core', () => ({ logger }));
jest.unstable_mockModule('node:process', () => ({
  cwd: () => CURRENT_WORKING_DIRECTORY,
}));

// `process.exit` is stubbed to throw so that execution stops where it would
// stop in production. `main` wraps its body in a try/catch, so the thrown
// sentinel is caught there and recorded as a follow-up `exit(1)`; production
// never reaches that second call, so assertions look at the first exit code.
class ProcessExitError extends Error {
  constructor(readonly code: number) {
    super(`process.exit(${code})`);
  }
}

const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new ProcessExitError(Number(code ?? 0));
});

/**
 * `app.ts` runs `main()` as a side effect of being imported, so each run needs
 * a fresh module registry.
 */
async function runMain(): Promise<unknown> {
  jest.resetModules();
  const appModule = (await import('../app')) as { default: Promise<void> };
  return appModule.default.then(
    () => undefined,
    (error: unknown) => error
  );
}

/**
 * `ProcessFunctionParams` intersects `Record<string, string | boolean | number>`
 * with `_: string[]`, which no object literal can satisfy, so the params are
 * built through a single cast here rather than at every call site.
 */
function buildParams(
  commands: string[],
  flags: Record<string, string | boolean | number> = {}
): ProcessFunctionParams {
  return { ...flags, _: commands } as unknown as ProcessFunctionParams;
}

function getFirstExitCode(): number | undefined {
  return exitSpy.mock.calls[0]?.[0] as number | undefined;
}

describe('app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    logger.silent = false;
    getParams.mockReturnValue(buildParams([]));
    init.mockResolvedValue(undefined);
    config.mockResolvedValue(undefined);
    help.mockResolvedValue(undefined);
    generateAndSave.mockResolvedValue(undefined);
  });

  afterAll(() => {
    exitSpy.mockRestore();
  });

  it('should export main', async () => {
    // Arrange
    jest.resetModules();

    // Act
    const appModule = await import('../app');

    // Assert
    expect(appModule.main).toBeDefined();
    expect(typeof appModule.main).toBe('function');
    await (appModule.default as Promise<void>).catch(() => undefined);
  });

  it('should run the init process function for the init argument', async () => {
    // Arrange
    const params = buildParams(['init']);
    getParams.mockReturnValue(params);

    // Act
    await runMain();

    // Assert
    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(CURRENT_WORKING_DIRECTORY, params);
    expect(config).not.toHaveBeenCalled();
    expect(help).not.toHaveBeenCalled();
    expect(generateAndSave).not.toHaveBeenCalled();
    expect(logger.end).toHaveBeenCalled();
    expect(getFirstExitCode()).toBe(0);
  });

  it('should run the config process function for the config argument', async () => {
    // Arrange
    const params = buildParams(['config']);
    getParams.mockReturnValue(params);

    // Act
    await runMain();

    // Assert
    expect(config).toHaveBeenCalledTimes(1);
    expect(config).toHaveBeenCalledWith(CURRENT_WORKING_DIRECTORY, params);
    expect(init).not.toHaveBeenCalled();
    expect(getFirstExitCode()).toBe(0);
  });

  it('should run the generateAndSave process function for the generate argument', async () => {
    // Arrange
    const params = buildParams(['generate']);
    getParams.mockReturnValue(params);

    // Act
    await runMain();

    // Assert
    expect(generateAndSave).toHaveBeenCalledTimes(1);
    expect(generateAndSave).toHaveBeenCalledWith(
      CURRENT_WORKING_DIRECTORY,
      params
    );
    expect(getFirstExitCode()).toBe(0);
  });

  it('should run the help process function for the help argument', async () => {
    // Arrange
    const params = buildParams(['help']);
    getParams.mockReturnValue(params);

    // Act
    await runMain();

    // Assert
    expect(help).toHaveBeenCalledTimes(1);
    expect(help).toHaveBeenCalledWith(CURRENT_WORKING_DIRECTORY, params);
    expect(getFirstExitCode()).toBe(0);
  });

  it('should only run the first matching process function', async () => {
    // Arrange
    getParams.mockReturnValue(buildParams(['config', 'init']));

    // Act
    await runMain();

    // Assert
    // `init` comes first in PROCESS_ARGUMENT_VECTORS, so it wins.
    expect(init).toHaveBeenCalledTimes(1);
    expect(config).not.toHaveBeenCalled();
  });

  it('should silence the logger before running the process function when the quiet flag is set', async () => {
    // Arrange
    getParams.mockReturnValue(
      buildParams(['generate'], { [PROCESS_ARGUMENT_PARAMS.QUIET]: true })
    );
    let silentDuringRun: boolean | undefined;
    generateAndSave.mockImplementation(async () => {
      silentDuringRun = logger.silent;
    });

    // Act
    await runMain();

    // Assert
    expect(silentDuringRun).toBe(true);
    expect(generateAndSave).toHaveBeenCalledTimes(1);
  });

  it('should silence the logger when the short quiet flag is set', async () => {
    // Arrange
    getParams.mockReturnValue(
      buildParams(['generate'], { [PROCESS_ARGUMENT_PARAMS.QUIET_SHORT]: true })
    );
    let silentDuringRun: boolean | undefined;
    generateAndSave.mockImplementation(async () => {
      silentDuringRun = logger.silent;
    });

    // Act
    await runMain();

    // Assert
    expect(silentDuringRun).toBe(true);
  });

  it('should leave the logger unsilenced when the quiet flag is absent', async () => {
    // Arrange
    getParams.mockReturnValue(buildParams(['generate']));
    let silentDuringRun: boolean | undefined;
    generateAndSave.mockImplementation(async () => {
      silentDuringRun = logger.silent;
    });

    // Act
    await runMain();

    // Assert
    expect(silentDuringRun).toBe(false);
  });

  it('should warn and exit with 1 when the argument is not a known command', async () => {
    // Arrange
    getParams.mockReturnValue(buildParams(['not-a-command']));

    // Act
    await runMain();

    // Assert
    expect(init).not.toHaveBeenCalled();
    expect(config).not.toHaveBeenCalled();
    expect(help).not.toHaveBeenCalled();
    expect(generateAndSave).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      `Unknown function requested, possible options are: [${PROCESS_ARGUMENT_VECTORS.map(
        (processArgVector) => processArgVector.argument
      ).join(', ')}]`
    );
    expect(logger.end).toHaveBeenCalled();
    expect(getFirstExitCode()).toBe(1);
  });

  it('should unsilence the logger, log the error and exit with 1 when a process function throws', async () => {
    // Arrange
    const error = new Error('process function failed');
    getParams.mockReturnValue(
      buildParams(['generate'], { [PROCESS_ARGUMENT_PARAMS.QUIET]: true })
    );
    generateAndSave.mockRejectedValueOnce(error);

    // Act
    await runMain();

    // Assert
    expect(logger.silent).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(error);
    expect(logger.end).toHaveBeenCalled();
    expect(getFirstExitCode()).toBe(1);
  });

  it('should not handle an error thrown while parsing the arguments', async () => {
    // Arrange
    const error = new Error('bad arguments');
    getParams.mockImplementation(() => {
      throw error;
    });

    // Act
    const thrown = await runMain();

    // Assert
    // `getParams` is called outside the try/catch, so the failure escapes
    // `main` unlogged rather than exiting with a message.
    expect(thrown).toBe(error);
    expect(logger.error).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
