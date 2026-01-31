"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiResponse {
    success;
    statusCode;
    message;
    data;
    constructor(statusCode, data, message = "Success") {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
exports.default = ApiResponse;
//# sourceMappingURL=ApiResponse.js.map