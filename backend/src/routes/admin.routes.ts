import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

/**
 * Admin Routes (TV5)
 * Prefix: /api/admin
 */

// Thống kê
router.get('/stats/revenue', AdminController.getStats);

// Nhật ký hệ thống
router.get('/audit-logs', AdminController.getAuditLogs);

// Cài đặt hệ thống
router.get('/settings', AdminController.getSettings);

// Quản lý tài khoản
router.get('/accounts', AdminController.getAccounts);
router.put('/accounts/:id/status', AdminController.patchAccountStatus);

export default router;
