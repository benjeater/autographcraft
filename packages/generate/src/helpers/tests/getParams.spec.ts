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
} from '../../constants';

// `getParams` reads `argv` from `node:process`, which is a live reference to
// the `process.argv` array, so the arguments are swapped in place rather than
// by reassigning the property.
const originalArgv = [...process.argv];

// `getParams` calls `process.exit` after printing the usage text for `--help`,
// which would tear the test worker down, so it is stubbed for the whole suite.
const exitSpy = jest
  .spyOn(process, 'exit')
  .mockImplementation(() => undefined as never);

// The usage text is written to the console by yargs' logger.
const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

function setArgv(args: string[]): void {
  process.argv.length = 0;
  process.argv.push(originalArgv[0] ?? 'node', 'app.js', ...args);
}

const { getParams } = await import('../getParams');

describe('getParams', () => {
  beforeEach(() => {
    exitSpy.mockClear();
    logSpy.mockClear();
    setArgv([]);
  });

  afterAll(() => {
    process.argv.length = 0;
    process.argv.push(...originalArgv);
    exitSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should be defined', () => {
    // Assert
    expect(getParams).toBeDefined();
  });

  it('should return an empty command list when no arguments are supplied', () => {
    // Act
    const params = getParams();

    // Assert
    expect(params._).toEqual([]);
    expect(params[PROCESS_ARGUMENT_PARAMS.QUIET]).toBeUndefined();
  });

  it('should return the init command with the default flag and its alias', () => {
    // Arrange
    setArgv(['init', `--${PROCESS_ARGUMENT_PARAMS.DEFAULT}`]);

    // Act
    const params = getParams();

    // Assert
    expect(params._).toEqual(['init']);
    expect(params[PROCESS_ARGUMENT_PARAMS.DEFAULT]).toBe(true);
    expect(params[PROCESS_ARGUMENT_PARAMS.DEFAULT_SHORT]).toBe(true);
  });

  it('should expand the short default flag onto the long name', () => {
    // Arrange
    setArgv(['init', `-${PROCESS_ARGUMENT_PARAMS.DEFAULT_SHORT}`]);

    // Act
    const params = getParams();

    // Assert
    expect(params[PROCESS_ARGUMENT_PARAMS.DEFAULT]).toBe(true);
  });

  it('should return the config command', () => {
    // Arrange
    setArgv(['config']);

    // Act
    const params = getParams();

    // Assert
    expect(params._).toEqual(['config']);
  });

  it('should return the help command for the application to dispatch', () => {
    // Arrange
    setArgv(['help']);

    // Act
    const params = getParams();

    // Assert
    expect(params._).toEqual(['help']);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should print the top level usage information and exit for the --help flag', () => {
    // Arrange
    setArgv([`--${PROCESS_ARGUMENT_PARAMS.HELP}`]);

    // Act
    const params = getParams();

    // Assert
    expect(params[PROCESS_ARGUMENT_PARAMS.HELP]).toBe(true);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const usageText = String(logSpy.mock.calls[0]?.[0]);
    expect(usageText).toContain('Commands:');
    for (const processArgumentVector of PROCESS_ARGUMENT_VECTORS) {
      expect(usageText).toContain(processArgumentVector.argument);
    }
    expect(usageText).toContain('Opens the help webpage');
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.HELP}`);
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.QUIET}`);
    // With no command on the line the usage is the command list, so no
    // command specific option appears in it.
    expect(usageText).not.toContain(`--${PROCESS_ARGUMENT_PARAMS.USERNAME}`);
    expect(usageText).not.toContain(`--${PROCESS_ARGUMENT_PARAMS.DEFAULT}`);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should print the generate command usage information for `generate --help`', () => {
    // Arrange
    setArgv([
      PROCESS_ARGUMENT_VECTORS[3].argument,
      `--${PROCESS_ARGUMENT_PARAMS.HELP}`,
    ]);

    // Act
    const params = getParams();

    // Assert
    expect(params._).toEqual([PROCESS_ARGUMENT_VECTORS[3].argument]);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const usageText = String(logSpy.mock.calls[0]?.[0]);
    // `--help` alongside a command prints that command's usage, not the
    // top level command list.
    expect(usageText).not.toContain('Commands:');
    expect(usageText).toContain('Generates the models from the schema');
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.USERNAME}`);
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.PASSWORD}`);
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.FORCE}`);
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS}`);
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.DRY_RUN}`);
    // The global options stay on every command's usage text.
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.QUIET}`);
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.HELP}`);
    // Another command's options do not.
    expect(usageText).not.toContain(`--${PROCESS_ARGUMENT_PARAMS.DEFAULT}`);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should print the init command usage information for `init --help`', () => {
    // Arrange
    setArgv([
      PROCESS_ARGUMENT_VECTORS[0].argument,
      `--${PROCESS_ARGUMENT_PARAMS.HELP}`,
    ]);

    // Act
    const params = getParams();

    // Assert
    expect(params._).toEqual([PROCESS_ARGUMENT_VECTORS[0].argument]);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const usageText = String(logSpy.mock.calls[0]?.[0]);
    expect(usageText).not.toContain('Commands:');
    expect(usageText).toContain('Initialises the AutoGraphCraft configuration');
    expect(usageText).toContain(`--${PROCESS_ARGUMENT_PARAMS.DEFAULT}`);
    expect(usageText).not.toContain(`--${PROCESS_ARGUMENT_PARAMS.USERNAME}`);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should not print the usage information when the --help flag is absent', () => {
    // Arrange
    setArgv(['generate']);

    // Act
    const params = getParams();

    // Assert
    expect(params[PROCESS_ARGUMENT_PARAMS.HELP]).toBeUndefined();
    expect(logSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should return the generate command with all of its options parsed', () => {
    // Arrange
    setArgv([
      'generate',
      `--${PROCESS_ARGUMENT_PARAMS.USERNAME}`,
      'test-user',
      `--${PROCESS_ARGUMENT_PARAMS.PASSWORD}`,
      'test-password',
      `--${PROCESS_ARGUMENT_PARAMS.FORCE}`,
      `--${PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS}`,
      `--${PROCESS_ARGUMENT_PARAMS.DRY_RUN}`,
    ]);

    // Act
    const params = getParams();

    // Assert
    expect(params._).toEqual(['generate']);
    expect(params[PROCESS_ARGUMENT_PARAMS.USERNAME]).toBe('test-user');
    expect(params[PROCESS_ARGUMENT_PARAMS.PASSWORD]).toBe('test-password');
    expect(params[PROCESS_ARGUMENT_PARAMS.FORCE]).toBe(true);
    expect(params[PROCESS_ARGUMENT_PARAMS.FORCE_SHORT]).toBe(true);
    expect(params[PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS]).toBe(true);
    expect(params[PROCESS_ARGUMENT_PARAMS.CLEAN_MODELS_SHORT]).toBe(true);
    expect(params[PROCESS_ARGUMENT_PARAMS.DRY_RUN]).toBe(true);
    expect(params[PROCESS_ARGUMENT_PARAMS.DRY_RUN_SHORT]).toBe(true);
  });

  it('should parse the quiet option on any command', () => {
    // Arrange
    setArgv(['generate', `-${PROCESS_ARGUMENT_PARAMS.QUIET_SHORT}`]);

    // Act
    const params = getParams();

    // Assert
    expect(params[PROCESS_ARGUMENT_PARAMS.QUIET]).toBe(true);
    expect(params[PROCESS_ARGUMENT_PARAMS.QUIET_SHORT]).toBe(true);
  });
});
