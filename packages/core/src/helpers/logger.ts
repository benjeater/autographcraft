import winston, { format } from 'winston';
import { LOGGER_FILE_PATH } from '../constants';

const myFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`;
});

const winstonFormat = format.combine(
  format.timestamp(),
  format.colorize(),
  myFormat
);

const winstonFileFormat = format.combine(format.timestamp(), myFormat);

const consoleLogger = new winston.transports.Console({
  format: winstonFormat,
});

const fileLogger = new winston.transports.File({
  filename: LOGGER_FILE_PATH,
  format: winstonFileFormat,
});

const logger = winston.createLogger({
  transports: [consoleLogger, fileLogger],
});

logger.on('finish', function () {
  // All log messages has now been logged
});

export default logger;
