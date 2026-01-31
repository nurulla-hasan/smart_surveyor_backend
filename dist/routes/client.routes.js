"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_controller_js_1 = require("../controllers/client.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = express_1.default.Router();
router.use(auth_middleware_js_1.protect);
router
    .route('/')
    .get(client_controller_js_1.getClients)
    .post(client_controller_js_1.createClient);
router
    .route('/:id')
    .get(client_controller_js_1.getClient)
    .put(client_controller_js_1.updateClient)
    .delete(client_controller_js_1.deleteClient);
exports.default = router;
//# sourceMappingURL=client.routes.js.map