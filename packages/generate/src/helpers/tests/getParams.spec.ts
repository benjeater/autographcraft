import {
  jest,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { PROCESS_ARGUMENT_PARAMS } from '../../constants';

// `getParams` reads `argv` from `node:process`, which is a live reference to
// the `process.argv` array, so the arguments are swapped in place rather than
// by reassigning the property.
const originalArgv = [...process.argv];

// yargs' built-in `help` command calls `process.exit`, which would tear the
// test worker down, so it is stubbed for the whole suite.
const exitSpy = jest
  .spyOn(process, 'exit')
  .mockImplementation(() => undefined as never);

function setArgv(args: string[]): void {
  process.argv.length = 0;
  process.argv.push(originalArgv[0] ?? 'node', 'app.js', ...args);
}

const { getParams } = await import('../getParams');

describe('getParams', () => {
  beforeEach(() => {
    exitSpy.mockClear();
    setArgv([]);
  });

  afterAll(() => {
    process.argv.length = 0;
    process.argv.push(...originalArgv);
    exitSpy.mockRestore();
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

  it("should be intercepted by yargs' built-in help command for the help argument", () => {
    // Arrange
    setArgv(['help']);

    // Act
    const params = getParams();

    // Assert
    // yargs owns the `help` command, so it prints the usage text and exits
    // rather than letting the argument through to the application.
    expect(exitSpy).toHaveBeenCalledWith(0);
    // The argument is consumed by yargs and never forwarded to the caller.
    expect(params._).toEqual([]);
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
