import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import * as seatHoldController from '../../controllers/booking/seat-hold.controller';

const router = Router();

router.post('/hold-seats', authMiddleware, seatHoldController.holdSeats);
router.post('/release-seats', authMiddleware, seatHoldController.releaseSeats);

export default router;
