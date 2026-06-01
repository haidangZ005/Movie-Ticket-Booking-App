import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getAvailableVouchers,
  getCheckoutVouchers,
  applyVoucher,
  suggestBestVoucher,
} from '../../controllers/voucher/voucher.controller';

const router = Router();

// GET /api/vouchers/checkout?totalAmount=&totalSeats=&showFormat=
// Lấy tất cả voucher visible cho customer cùng trạng thái applicable
router.get('/checkout', authMiddleware, getCheckoutVouchers);

// GET /api/vouchers/suggest?totalAmount=&totalSeats=&showFormat=
// Auto-suggest voucher tốt nhất
router.get('/suggest', authMiddleware, suggestBestVoucher);

// POST /api/vouchers/apply — Validate + áp dụng voucher + tính giá sau giảm
router.post('/apply', authMiddleware, applyVoucher);

// GET /api/vouchers?totalAmount=&totalSeats=&showFormat=
// Lấy danh sách voucher hợp lệ FEFO (yêu cầu đăng nhập)
router.get('/', authMiddleware, getAvailableVouchers);

export default router;