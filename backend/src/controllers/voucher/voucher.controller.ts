import { Request, Response } from 'express';
import { VoucherModel } from '../../models/voucher.model';
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

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, vouchers));
});

/**
 * POST /api/vouchers/apply
 * Áp dụng voucher vào booking — tăng UsageCount + ghi VoucherUsage.
 * Body: { voucherId, bookingId }
 */
export const applyVoucher = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user!.customerId;
  const { voucherId, bookingId } = req.body;

  if (!voucherId || !bookingId) {
    throw new AppException(ErrorCode.INVALID_DATA);
  }

  // Kiểm tra voucher tồn tại
  const voucher = await VoucherModel.getById(voucherId);
  if (!voucher) throw new AppException(ErrorCode.DATA_NOT_FOUND);

  await VoucherModel.applyVoucher(voucherId, customerId, bookingId);

  // Tính số tiền giảm
  let discountAmount = 0;
  if (voucher.DiscountType === 'PERCENT') {
    discountAmount = (voucher.DiscountValue / 100) * req.body.totalAmount;
    if (voucher.MaxDiscount) {
      discountAmount = Math.min(discountAmount, voucher.MaxDiscount);
    }
  } else {
    discountAmount = voucher.DiscountValue;
  }

  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, {
    voucherId,
    discountAmount,
    voucherCode: voucher.Code,
  }));
});

