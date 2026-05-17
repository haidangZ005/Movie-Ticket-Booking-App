import { Router } from 'express';

import authRoutes from './auth/auth.routes';
import customerRoutes from './customer/customer.routes';
import movieRoutes from './movie/movie.routes';
import cinemaRoutes from './cinema/cinema.routes';
import showRoutes from './show/show.routes';
import adminRoutes from './admin/admin.routes';
// import bookingRoutes from './booking/booking.routes';
// import notificationRoutes from './notification/notification.routes';
import paymentRoutes from './payment/payment.routes';
// import productRoutes from './product/product.routes';
// import voucherRoutes from './voucher/voucher.routes';

const router = Router();

// Mount routes under /api
router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/movies', movieRoutes);
router.use('/cinemas', cinemaRoutes);
router.use('/shows', showRoutes);
router.use('/admin', adminRoutes);
// router.use('/bookings', bookingRoutes);
// router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
// router.use('/products', productRoutes);
// router.use('/vouchers', voucherRoutes);

export default router;
