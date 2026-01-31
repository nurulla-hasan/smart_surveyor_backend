class ApiError extends Error {
    statusCode;
    success;
    errors;
    constructor(statusCode, message, errors = [], stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export default ApiError;
//# sourceMappingURL=ApiError.js.map