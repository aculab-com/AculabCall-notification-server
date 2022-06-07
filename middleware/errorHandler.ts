import { logEvents } from './logEvents';
import { NextFunction, Request, Response } from 'express';

/**
 * error handles, logs errors
 * @param {Error} err error to log 
 * @param {Request} req request caused error 
 * @param {Response} res response to request
 * @param {NextFunction} next next function (currently not used)
 */
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logEvents(`${err.name}: ${err.message}`, 'errLog.txt');
  console.error(err.stack);
  res.status(500).send(err.message);
};

export default errorHandler;
