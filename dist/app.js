"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const hpp_1 = __importDefault(require("hpp"));
const morgan_1 = __importDefault(require("morgan"));
const error_middleware_js_1 = __importDefault(require("./middlewares/error.middleware.js"));
const index_js_1 = __importDefault(require("./routes/index.js"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true
}));
// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 10000 : (Number(process.env.RATE_LIMIT_MAX) || 100),
    message: 'Too many requests, please try again later'
});
app.use('/api', limiter);
// Body parser
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Data sanitization
app.use((0, hpp_1.default)());
// API routes placeholder
app.get('/', (_req, res) => {
    res.json({ message: 'Welcome to Smart Surveyor API' });
});
app.use('/api/v1', index_js_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
// Global error handler
app.use(error_middleware_js_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map