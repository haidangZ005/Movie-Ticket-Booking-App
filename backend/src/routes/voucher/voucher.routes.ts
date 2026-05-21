import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getAvailableVouchers,
  applyVoucher,
} from '../../controllers/voucher/voucher.controller';

const router = Router();

// GET /api/vouchers?totalAmount=&totalSeats=&showFormat=
// Lấy danh sách voucher hợp lệ FEFO (yêu cầu đăng nhập)
router.get('/', authMiddleware, getAvailableVouchers);

// POST /api/vouchers/apply — Áp dụng voucher vào booking
router.post('/apply', authMiddleware, applyVoucher);

export default router;
