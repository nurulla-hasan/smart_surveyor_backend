import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { AnyZodObject } from 'zod';
import ApiError from '../utils/ApiError.js';

const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error: any) {
    const errorMessage = error.errors.map((err: any) => err.message).join(', ');
    next(new ApiError(400, errorMessage));
  }
};

export default validate;
