"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const validate_middleware_js_1 = __importDefault(require("../middlewares/validate.middleware.js"));
const auth_validation_js_1 = require("../validations/auth.validation.js");
const router = express_1.default.Router();
router.post('/register', (0, validate_middleware_js_1.default)(auth_validation_js_1.registerSchema), auth_controller_js_1.register);
router.post('/login', (0, validate_middleware_js_1.default)(auth_validation_js_1.loginSchema), auth_controller_js_1.login);
router.post('/refresh-token', auth_controller_js_1.refresh);
router.get('/logout', auth_controller_js_1.logout);
router.get('/me', auth_middleware_js_1.protect, auth_controller_js_1.getMe);
router.post('/change-password', auth_middleware_js_1.protect, auth_controller_js_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map