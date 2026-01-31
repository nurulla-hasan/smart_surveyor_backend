import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
declare const validate: (schema: z.ZodObject<any>) => (req: Request, _res: Response, next: NextFunction) => void;
export default validate;
//# sourceMappingURL=validate.middleware.d.ts.map