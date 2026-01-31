declare class ApiError extends Error {
    statusCode: number;
    success: boolean;
    errors: any[];
    constructor(statusCode: number, message: string, errors?: any[], stack?: string);
}
export default ApiError;
//# sourceMappingURL=ApiError.d.ts.map