"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
const errorHandler = (err, _req, res, _next) => {
    let error = { ...err };
    error.message = err.message;
    console.error(err);
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new ApiError_js_1.default(404, message);
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplicate field value: ${field}`;
        error = new ApiError_js_1.default(400, message);
    }
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val) => val.message);
        error = new ApiError_js_1.default(400, messages.join(', '));
    }
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError_js_1.default(401, 'Invalid token');
    }
    if (err.name === 'TokenExpiredError') {
        error = new ApiError_js_1.default(401, 'Token expired');
    }
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        errors: error.errors || [],
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
exports.default = errorHandler;
//# sourceMappingURL=error.middleware.js.map