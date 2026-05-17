import { Request, Response, NextFunction } from 'express';
import { AdminModel } from '../../models/admin.model';

/**
 * Admin Controller (TV5)
 */
export class AdminController {
  
  /**
   * GET /api/admin/stats/revenue
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await AdminModel.getRevenueStats();
      const marketShare = await AdminModel.getMarketShare();
      
      res.status(200).json({
        success: true,
        data: {
          summary,
          marketShare
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/audit-logs
   */
  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await AdminModel.getAuditLogs();
      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/settings
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await AdminModel.getSystemSettings();
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/accounts/:id/status
   */
  static async patchAccountStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      await AdminModel.updateAccountStatus(Number(id), isActive);
      
      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái tài khoản thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}
