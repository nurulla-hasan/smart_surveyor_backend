"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const calculation_controller_js_1 = require("../controllers/calculation.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = express_1.default.Router();
router.use(auth_middleware_js_1.protect);
router
    .route('/')
    .get(calculation_controller_js_1.getCalculations)
    .post(calculation_controller_js_1.saveCalculation);
router
    .route('/:id')
    .delete(calculation_controller_js_1.deleteCalculation);
exports.default = router;
//# sourceMappingURL=calculation.routes.js.map