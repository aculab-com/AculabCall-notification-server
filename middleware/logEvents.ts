import { format } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

/**
 * log events helper function
 * @param {string} message message to log
 * @param {string} logName message log title
 */
const logEvents = async (message: string, logName: string) => {
  const dateTime = `${format(new Date(), 'yyyyMMdd\tHH:mm:ss')}`;
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
      await fsPromises.mkdir(path.join(__dirname, '..', 'logs'));
    }

    await fsPromises.appendFile(
      path.join(__dirname, '..', 'logs', logName),
      logItem
    );
  } catch (err) {
    console.error('[ logEvents ]', err);
  }
};

/**
 * log event into reqLog.txt
 * @param {Request} req request
 * @param {Response} res response 
 * @param {NextFunction} next function to run before logger ends 
 */
const logger = (req: Request, res: Response, next: NextFunction) => {
  logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, 'reqLog.txt');
  console.log(`${req.method} ${req.path}`);
  next();
};

export { logger, logEvents };
