import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';
import * as bookingController from '../../controllers/booking/booking.controller';

const router = Router();

router.get('/my', authMiddleware, roleMiddleware(['CUSTOMER']), bookingController.getMyBookings);

export default router;
