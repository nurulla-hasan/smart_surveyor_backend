"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const user_routes_js_1 = __importDefault(require("./user.routes.js"));
const client_routes_js_1 = __importDefault(require("./client.routes.js"));
const booking_routes_js_1 = __importDefault(require("./booking.routes.js"));
const report_routes_js_1 = __importDefault(require("./report.routes.js"));
const calculation_routes_js_1 = __importDefault(require("./calculation.routes.js"));
const map_routes_js_1 = __importDefault(require("./map.routes.js"));
const blockedDate_routes_js_1 = __importDefault(require("./blockedDate.routes.js"));
const dashboard_routes_js_1 = __importDefault(require("./dashboard.routes.js"));
const notification_routes_js_1 = __importDefault(require("./notification.routes.js"));
const router = express_1.default.Router();
router.use('/auth', auth_routes_js_1.default);
router.use('/users', user_routes_js_1.default);
router.use('/clients', client_routes_js_1.default);
router.use('/bookings', booking_routes_js_1.default);
router.use('/reports', report_routes_js_1.default);
router.use('/calculations', calculation_routes_js_1.default);
router.use('/maps', map_routes_js_1.default);
router.use('/blocked-dates', blockedDate_routes_js_1.default);
router.use('/dashboard', dashboard_routes_js_1.default);
router.use('/notifications', notification_routes_js_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map