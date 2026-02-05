"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_js_1 = require("../controllers/user.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const multer_middleware_js_1 = require("../middlewares/multer.middleware.js");
const router = express_1.default.Router();
router.get('/surveyors', user_controller_js_1.getSurveyors);
router.get('/surveyors/:id', user_controller_js_1.getSurveyorProfile);
router.use(auth_middleware_js_1.protect);
router
    .route('/profile')
    .get(user_controller_js_1.getProfile)
    .put(multer_middleware_js_1.upload.single('profileImage'), user_controller_js_1.updateProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map