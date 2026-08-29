import { jest, describe, it, expect } from '@jest/globals';
import { LOGGER_FILE_PATH } from '../../constants';

// The logger module builds its winston formats and transports as a side effect
// of being imported, so winston is mocked to capture what it is handed rather
// than creating a real console/file logger. ESM has no automocking, so the
// members the module reaches for are named explicitly and the module under test
// is imported after the mock is registered.
type PrintfTemplate = (info: {
  level: string;
  message: string;
  timestamp?: string;
}) => string;

const printf = jest.fn<(template: PrintfTemplate) => string>(
  () => 'printfFormat'
);
const timestamp = jest.fn(() => 'timestampFormat');
const colorize = jest.fn(() => 'colorizeFormat');
const combine = jest.fn((...formats: string[]) => formats.join('+'));

const ConsoleTransport = jest.fn();
const FileTransport = jest.fn();
const on = jest.fn<(event: string, listener: () => void) => void>();
const createLogger = jest.fn<
  (options: { transports: unknown[] }) => { on: typeof on }
>(() => ({ on }));

jest.unstable_mockModule('winston', () => ({
  default: {
    createLogger,
    transports: { Console: ConsoleTransport, File: FileTransport },
  },
  format: { printf, timestamp, colorize, combine },
}));

const logger = (await import('../logger')).default;

describe('logger', () => {
  it('should export the created winston logger', () => {
    expect(logger).toBe(createLogger.mock.results[0].value);
    expect(createLogger).toHaveBeenCalledTimes(1);
  });

  it('should create a colourised console transport and a plain file transport', () => {
    // Assert
    expect(ConsoleTransport).toHaveBeenCalledTimes(1);
    expect(ConsoleTransport).toHaveBeenCalledWith({
      format: 'timestampFormat+colorizeFormat+printfFormat',
    });
    expect(FileTransport).toHaveBeenCalledTimes(1);
    expect(FileTransport).toHaveBeenCalledWith({
      filename: LOGGER_FILE_PATH,
      format: 'timestampFormat+printfFormat',
    });
  });

  it('should register both transports on the logger', () => {
    expect(createLogger).toHaveBeenCalledWith({
      transports: [expect.any(ConsoleTransport), expect.any(FileTransport)],
    });
  });

  it('should format a log entry as "timestamp - level: message"', () => {
    // Arrange
    const template = printf.mock.calls[0][0];

    // Act
    const result = template({
      level: 'info',
      message: 'A log message',
      timestamp: '2021-01-01T12:43:54.987Z',
    });

    // Assert
    expect(result).toEqual('2021-01-01T12:43:54.987Z - info: A log message');
  });

  it('should register a finish listener that completes without error', () => {
    // Arrange
    expect(on).toHaveBeenCalledWith('finish', expect.any(Function));
    const finishListener = on.mock.calls[0][1];

    // Act / Assert
    expect(() => finishListener()).not.toThrow();
  });
});
