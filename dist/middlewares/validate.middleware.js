"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_js_1 = __importDefault(require("../utils/ApiError.js"));
const validate = (schema) => (req, _res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    }
    catch (error) {
        const errorMessage = error.errors.map((err) => err.message).join(', ');
        next(new ApiError_js_1.default(400, errorMessage));
    }
};
exports.default = validate;
//# sourceMappingURL=validate.middleware.js.map