import winston, { format } from 'winston';

const myFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`;
});

const winstonFormat = format.combine(
  format.timestamp(),
  format.colorize(),
  myFormat
);

const winstonFileFormat = format.combine(format.timestamp(), myFormat);

winston.configure({
  transports: [
    new winston.transports.Console({
      format: winstonFormat,
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format: winstonFileFormat,
    }),
  ],
});

export const logger = winston;

export default winston;
