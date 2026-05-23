import { Request, Response } from 'express';
import { VoucherModel } from '../../models/voucher.model';
import { VoucherService } from '../../services/voucher.service';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

// =================================
// ADMIN — Quản lý Voucher (M6)
// =================================

// GET /api/admin/vouchers
export const getAllVouchers = asyncHandler(async (req: Request, res: Response) => {
  const vouchers = await VoucherModel.getAll();
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, vouchers));
});

// GET /api/admin/vouchers/:id
export const getVoucherById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const voucher = await VoucherModel.getById(id);
  if (!voucher) throw new AppException(ErrorCode.DATA_NOT_FOUND);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, voucher));
});

// POST /api/admin/vouchers
export const createVoucher = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await VoucherModel.create(req.body);
  return res.status(201).json(ApiResponse.success(ResponseCode.SUCCESS, voucher));
});

// PUT /api/admin/vouchers/:id
export const updateVoucher = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = await VoucherModel.getById(id);
  if (!existing) throw new AppException(ErrorCode.DATA_NOT_FOUND);

  const voucher = await VoucherModel.update(id, req.body);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, voucher));
});

// DELETE /api/admin/vouchers/:id
export const deleteVoucher = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = await VoucherModel.getById(id);
  if (!existing) throw new AppException(ErrorCode.DATA_NOT_FOUND);

  await VoucherModel.delete(id);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, null));
});

// =================================
// CUSTOMER — Dùng Voucher (M6)
// =================================

/**
 * GET /api/vouchers?totalAmount=&totalSeats=&showFormat=
 * Lấy danh sách voucher hợp lệ FEFO cho customer hiện tại.
 * Kèm theo discountAmount tính sẵn cho mỗi voucher.
 */
export const getAvailableVouchers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const totalAmount = parseFloat(req.query.totalAmount as string) || 0;
  const totalSeats = parseInt(req.query.totalSeats as string) || 1;
  const showFormat = (req.query.showFormat as string) || 'ALL';

  const vouchers = await VoucherModel.getAvailableVouchers({
    customerId,
    totalAmount,
    totalSeats,
    showFormat,
  });

  // Tính sẵn discountAmount cho mỗi voucher để Mobile hiển thị
  const enriched = vouchers.map(v => ({
    ...v,
    discountAmount: VoucherService.calculateDiscount(v, totalAmount),
    finalAmount: Math.max(totalAmount - VoucherService.calculateDiscount(v, totalAmount), 0),
  }));

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, enriched));
});

/**
 * POST /api/vouchers/apply
 * Validate đầy đủ điều kiện → áp dụng voucher → tính giá sau giảm.
 * Body: { voucherId, bookingId, totalAmount, totalSeats, showFormat }
 */
export const applyVoucher = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const { voucherId, bookingId, totalAmount, totalSeats, showFormat } = req.body;

  if (!voucherId || !bookingId || !totalAmount) {
    throw new AppException(ErrorCode.INVALID_DATA);
  }

  const result = await VoucherService.applyAndCalculate(
    voucherId,
    customerId,
    bookingId,
    totalAmount,
    totalSeats || 1,
    showFormat || 'ALL'
  );

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, result));
});

/**
 * GET /api/vouchers/suggest?totalAmount=&totalSeats=&showFormat=
 * Auto-suggest voucher tốt nhất (giảm nhiều tiền nhất) cho customer.
 */
export const suggestBestVoucher = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const totalAmount = parseFloat(req.query.totalAmount as string) || 0;
  const totalSeats = parseInt(req.query.totalSeats as string) || 1;
  const showFormat = (req.query.showFormat as string) || 'ALL';

  const suggestion = await VoucherService.suggestBestVoucher({
    customerId,
    totalAmount,
    totalSeats,
    showFormat,
  });

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, suggestion));
});


