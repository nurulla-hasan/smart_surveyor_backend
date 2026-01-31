declare class ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    constructor(statusCode: number, data: T, message?: string);
}
export default ApiResponse;
//# sourceMappingURL=ApiResponse.d.ts.map