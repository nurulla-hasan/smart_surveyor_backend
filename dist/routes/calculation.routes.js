import express from 'express';
import { getCalculations, saveCalculation, deleteCalculation } from '../controllers/calculation.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
const router = express.Router();
router.use(protect);
router
    .route('/')
    .get(getCalculations)
    .post(saveCalculation);
router
    .route('/:id')
    .delete(deleteCalculation);
export default router;
//# sourceMappingURL=calculation.routes.js.map