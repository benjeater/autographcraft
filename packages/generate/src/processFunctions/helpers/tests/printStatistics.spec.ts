import {
  jest,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import type { OutputFileDetail } from '@autographcraft/core';

// ESM mock factories must provide every export the module graph reaches for -
// a missing one is a SyntaxError, not `undefined` - so spread the real module
// and override only the logger this suite asserts against.
const actualCore = jest.requireActual<typeof import('@autographcraft/core')>(
  '@autographcraft/core'
);

jest.unstable_mockModule('@autographcraft/core', () => ({
  ...actualCore,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { logger } = await import('@autographcraft/core');
const { printStatistics } = await import('../printStatistics');

function getOutputFiles(count: number): OutputFileDetail[] {
  return Array.from({ length: count }, (_unused, index) => ({
    filePath: `/project/generated/file${index}.ts`,
    content: 'content',
    addIgnoreHeader: true,
    shouldOverwrite: true,
  }));
}

const START_TIME = 1_000_000_000n;

describe('printStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 2.5 seconds after the start time, in nanoseconds
    jest
      .spyOn(process.hrtime, 'bigint')
      .mockReturnValue(START_TIME + 2_500_000_000n);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    // Assert
    expect(printStatistics).toBeDefined();
  });

  it('should log the statistics header, the file count and the elapsed time', () => {
    // Arrange
    const outputFiles = getOutputFiles(3);

    // Act
    printStatistics({ outputFiles, isDryRun: false, startTime: START_TIME });

    // Assert
    expect(logger.info).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenNthCalledWith(1, '📊 Statistics:');
    expect(logger.info).toHaveBeenNthCalledWith(2, '📊 Files written: 3');
    expect(logger.info).toHaveBeenNthCalledWith(3, '📊 Time taken: 2.50s');
  });

  it('should report zero files written on a dry run even when there are output files', () => {
    // Arrange
    const outputFiles = getOutputFiles(7);

    // Act
    printStatistics({ outputFiles, isDryRun: true, startTime: START_TIME });

    // Assert
    expect(logger.info).toHaveBeenNthCalledWith(2, '📊 Files written: 0');
  });

  it('should report zero files written when there are no output files', () => {
    // Act
    printStatistics({
      outputFiles: [],
      isDryRun: false,
      startTime: START_TIME,
    });

    // Assert
    expect(logger.info).toHaveBeenNthCalledWith(2, '📊 Files written: 0');
  });

  it('should round the elapsed time to two decimal places', () => {
    // Arrange
    jest
      .spyOn(process.hrtime, 'bigint')
      .mockReturnValue(START_TIME + 1_234_567_890n);

    // Act
    printStatistics({
      outputFiles: [],
      isDryRun: false,
      startTime: START_TIME,
    });

    // Assert
    expect(logger.info).toHaveBeenNthCalledWith(3, '📊 Time taken: 1.23s');
  });

  it('should report a zero elapsed time when no time has passed', () => {
    // Arrange
    jest.spyOn(process.hrtime, 'bigint').mockReturnValue(START_TIME);

    // Act
    printStatistics({
      outputFiles: [],
      isDryRun: false,
      startTime: START_TIME,
    });

    // Assert
    expect(logger.info).toHaveBeenNthCalledWith(3, '📊 Time taken: 0.00s');
  });
});
