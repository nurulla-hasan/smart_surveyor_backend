"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = __importDefault(require("./app.js"));
const prisma_js_1 = require("./lib/prisma.js");
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        await prisma_js_1.prisma.$connect();
        console.log('✅ MongoDB Connected via Prisma');
        const server = app_js_1.default.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
        // Handle unhandled rejections
        process.on('unhandledRejection', (err) => {
            console.error('UNHANDLED REJECTION! Shutting down...');
            console.error(err.name, err.message);
            server.close(() => process.exit(1));
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map