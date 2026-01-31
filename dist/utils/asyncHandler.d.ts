import type { Request, Response, NextFunction } from 'express';
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
declare const asyncHandler: (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => void;
export default asyncHandler;
//# sourceMappingURL=asyncHandler.d.ts.map