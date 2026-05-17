import { Router } from 'express';
import { CustomerController } from '../../controllers/customer/customer.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// Lấy thông tin Profile cá nhân
// Middleware xếp ngăn xếp tuần tự: Bắt buộc Đăng nhập -> Bắt buộc là CUSTOMER -> Xử lý API
router.get('/profile', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.getProfile);

// Cập nhật thông tin Profile cá nhân
router.put('/profile', authMiddleware, roleMiddleware(['CUSTOMER']), CustomerController.updateProfile);

export default router;
