"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const map_controller_js_1 = require("../controllers/map.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = express_1.default.Router();
router.use(auth_middleware_js_1.protect);
router.get('/shared', map_controller_js_1.getClientSharedMaps);
router
    .route('/')
    .get(map_controller_js_1.getMaps)
    .post(map_controller_js_1.saveMap);
router
    .route('/:id')
    .delete(map_controller_js_1.deleteMap);
exports.default = router;
//# sourceMappingURL=map.routes.js.map