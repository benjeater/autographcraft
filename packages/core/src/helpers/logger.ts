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

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winstonFormat,
    }),
    new winston.transports.File({
      filename: LOGGER_FILE_PATH,
      format: winstonFileFormat,
    }),
  ],
});

export default logger;
