"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const report_controller_js_1 = require("../controllers/report.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const multer_middleware_js_1 = require("../middlewares/multer.middleware.js");
const router = express_1.default.Router();
router.use(auth_middleware_js_1.protect);
router
    .route('/')
    .get(report_controller_js_1.getReports)
    .post(multer_middleware_js_1.upload.single('reportFile'), report_controller_js_1.createReport);
router
    .route('/:id')
    .get(report_controller_js_1.getReport)
    .put(multer_middleware_js_1.upload.single('reportFile'), report_controller_js_1.updateReport)
    .delete(report_controller_js_1.deleteReport);
exports.default = router;
//# sourceMappingURL=report.routes.js.map