import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import * as bookingController from '../../controllers/booking/booking.controller';
import * as seatHoldController from '../../controllers/booking/seat-hold.controller';
import * as ticketController from '../../controllers/booking/ticket.controller';

const router = Router();

router.get('/my-tickets', authMiddleware, ticketController.getMyTickets);
router.post('/', authMiddleware, bookingController.createBooking);
router.post('/hold-seats', authMiddleware, seatHoldController.holdSeats);
router.post('/release-seats', authMiddleware, seatHoldController.releaseSeats);

export default router;
