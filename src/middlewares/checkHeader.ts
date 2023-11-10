import { NextFunction, Request, Response } from 'express';
import auth from './auth';

export default async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token || token === 'null') {
    next();
  } else {
    auth(req, res, next);
  }
};
