"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_js_1 = require("../controllers/notification.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = express_1.default.Router();
router.use(auth_middleware_js_1.protect);
router.get('/', notification_controller_js_1.getNotifications);
router.patch('/read-all', notification_controller_js_1.markAllAsRead);
router.patch('/:id/read', notification_controller_js_1.markAsRead);
router.delete('/:id', notification_controller_js_1.deleteNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map