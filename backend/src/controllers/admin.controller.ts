import { Request, Response } from 'express';
import { AdminModel } from '../models/admin.model';
import { asyncHandler } from '../utils/helpers/async.handler';

/**
 * Admin Controller (TV5)
 */
export class AdminController {
  
  /**
   * GET /api/admin/stats/revenue
   */
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const summary = await AdminModel.getRevenueStats();
    const marketShare = await AdminModel.getMarketShare();
    
    res.status(200).json({
      success: true,
      data: {
        summary,
        marketShare
      }
    });
  });

  /**
   * GET /api/admin/audit-logs
   */
  static getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    const logs = await AdminModel.getAuditLogs();
    res.status(200).json({
      success: true,
      data: logs
    });
  });

  /**
   * GET /api/admin/settings
   */
  static getSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await AdminModel.getSystemSettings();
    res.status(200).json({
      success: true,
      data: settings
    });
  });

  /**
   * PUT /api/admin/accounts/:id/status
   */
  static patchAccountStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;
    
    await AdminModel.updateAccountStatus(Number(id), isActive);
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái tài khoản thành công'
    });
  });
}
