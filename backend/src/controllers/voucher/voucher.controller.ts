import { Request, Response } from 'express';
import { VoucherModel } from '../../models/voucher.model';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';

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
