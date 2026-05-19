import { Router } from 'express';
import * as productController from '../../controllers/product/product.controller';

const router = Router();

// === Quản lý Sản phẩm / Combo (Public) ===
// Khách hàng xem danh sách sản phẩm để đặt món (chỉ hiện sản phẩm active)
router.get('/', productController.getPublicProducts);

export default router;
