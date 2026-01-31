"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_controller_js_1 = require("../controllers/dashboard.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = express_1.default.Router();
router.use(auth_middleware_js_1.protect);
router.get('/stats', dashboard_controller_js_1.getStats);
router.get('/monthly-stats', dashboard_controller_js_1.getMonthlyStats);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map