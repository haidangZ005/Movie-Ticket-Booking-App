import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import {
  getAvailableVouchers,
  applyVoucher,
  suggestBestVoucher,
} from '../../controllers/voucher/voucher.controller';

const router = Router();

// GET /api/vouchers?totalAmount=&totalSeats=&showFormat=
// Lấy danh sách voucher hợp lệ FEFO (yêu cầu đăng nhập)
router.get('/', authMiddleware, getAvailableVouchers);

// GET /api/vouchers/suggest?totalAmount=&totalSeats=&showFormat=
// Auto-suggest voucher tốt nhất
router.get('/suggest', authMiddleware, suggestBestVoucher);

// POST /api/vouchers/apply — Validate + áp dụng voucher + tính giá sau giảm
router.post('/apply', authMiddleware, applyVoucher);

export default router;

