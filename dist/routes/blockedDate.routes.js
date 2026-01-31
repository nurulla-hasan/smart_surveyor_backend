"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const blockedDate_controller_js_1 = require("../controllers/blockedDate.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = express_1.default.Router();
router.use(auth_middleware_js_1.protect);
router.get('/', blockedDate_controller_js_1.getBlockedDates);
router.post('/toggle', blockedDate_controller_js_1.toggleBlockedDate);
exports.default = router;
//# sourceMappingURL=blockedDate.routes.js.map