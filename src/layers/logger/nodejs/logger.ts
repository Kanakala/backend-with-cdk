import { createLogger, format, transports } from 'winston';
import { loggerLevel } from '../../../config/config';
const { combine, timestamp, printf } = format;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loggerFormat = printf((info: any) => {
  return `${info.timestamp} | ${info.level}: ${info.message}`;
});

export const logger = createLogger({
  level: loggerLevel,
  format: combine(format.colorize(), timestamp(), loggerFormat),
  transports: [new transports.Console()],
});
