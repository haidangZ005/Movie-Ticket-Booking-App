import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { CustomerService } from '../../services/customer.service';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { CustomerModel } from '../../models/customer.model';
import { AccountModel } from '../../models/account.model';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';

export class CustomerController {
  static adminGetCustomers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, keyword, isActive } = req.query;
    const parsedIsActive = isActive === undefined ? undefined : String(isActive) === 'true';

    const { customers, total } = await CustomerModel.adminGetAll({
      page: Number(page),
      limit: Number(limit),
      keyword: keyword ? String(keyword) : undefined,
      isActive: parsedIsActive
    });

    res.status(200).json(ApiResponse.paginate(ResponseCode.SUCCESS, customers, {
      page: Number(page),
      limit: Number(limit),
      total
    }));
  });

  static adminGetCustomerById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customer = await CustomerModel.adminGetById(Number(req.params.id));
    if (!customer) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, customer));
  });

  static adminCreateCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const email = String(req.body.Email || req.body.email || '').trim().toLowerCase();
    const password = String(req.body.Password || req.body.password || '');

    if (!email || !password) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    const existingAccount = await AccountModel.findByEmail(email);
    if (existingAccount) {
      throw new AppException(ErrorCode.USER_EXISTED);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await CustomerModel.adminCreate({
      Email: email,
      PasswordHash: passwordHash,
      AccountType: 'CUSTOMER',
      IsActive: req.body.IsActive ?? req.body.isActive ?? true,
      IsVerified: req.body.IsVerified ?? req.body.isVerified ?? true,
      FullName: req.body.FullName || req.body.fullName,
      CustomerEmail: req.body.CustomerEmail || req.body.customerEmail || email,
      PhoneNumber: req.body.PhoneNumber || req.body.phoneNumber,
      Gender: req.body.Gender || req.body.gender,
      DateOfBirth: req.body.DateOfBirth || req.body.dateOfBirth,
      LoyaltyPoints: req.body.LoyaltyPoints ?? req.body.loyaltyPoints ?? 0,
      AvatarUrl: req.body.AvatarUrl || req.body.avatarUrl
    });

    res.status(201).json(ApiResponse.success(ResponseCode.USER_CREATED, customer));
  });

  static adminUpdateCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customerId = Number(req.params.id);
    const existingCustomer = await CustomerModel.adminGetById(customerId);
    if (!existingCustomer) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    const email = req.body.Email || req.body.email;
    if (email && String(email).trim().toLowerCase() !== String(existingCustomer.Email).toLowerCase()) {
      const existingAccount = await AccountModel.findByEmail(String(email).trim().toLowerCase());
      if (existingAccount) {
        throw new AppException(ErrorCode.USER_EXISTED);
      }
    }

    const customer = await CustomerModel.adminUpdate(customerId, {
      Email: email ? String(email).trim().toLowerCase() : undefined,
      IsActive: req.body.IsActive ?? req.body.isActive,
      IsVerified: req.body.IsVerified ?? req.body.isVerified,
      FullName: req.body.FullName || req.body.fullName,
      CustomerEmail: req.body.CustomerEmail || req.body.customerEmail,
      PhoneNumber: req.body.PhoneNumber || req.body.phoneNumber,
      Gender: req.body.Gender || req.body.gender,
      DateOfBirth: req.body.DateOfBirth || req.body.dateOfBirth,
      LoyaltyPoints: req.body.LoyaltyPoints ?? req.body.loyaltyPoints,
      AvatarUrl: req.body.AvatarUrl || req.body.avatarUrl
    });

    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, customer));
  });

  static adminDeleteCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const customer = await CustomerModel.adminSetAccountStatus(Number(req.params.id), false);
    if (!customer) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, customer));
  });

  static adminSetCustomerStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const isActive = req.body.IsActive ?? req.body.isActive;
    if (typeof isActive !== 'boolean') {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    const customer = await CustomerModel.adminSetAccountStatus(Number(req.params.id), isActive);
    if (!customer) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, customer));
  });

  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    const result = await CustomerService.getProfile(accountId);
    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, result));
  });

  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    const payload = {
      FullName: req.body.FullName || req.body.fullName,
      PhoneNumber: req.body.PhoneNumber || req.body.phoneNumber,
      Gender: req.body.Gender || req.body.gender,
      DateOfBirth: req.body.DateOfBirth || req.body.dateOfBirth,
      AvatarUrl: req.body.AvatarUrl || req.body.avatarUrl
    };

    const result = await CustomerService.updateProfile(accountId, payload);
    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, result));
  });

  static getLoyaltyPoints = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await CustomerService.getLoyaltyPoints(accountId, page, limit);
    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, result));
  });

  static getMyVouchers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    const vouchers = await CustomerService.getMyVouchers(accountId);
    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, vouchers));
  });

  static getPaymentHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await CustomerService.getPaymentHistory(accountId, page, limit);
    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, result));
  });

  static getPaymentHistoryDetail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    const bookingId = Number(req.params.bookingId);

    if (!bookingId) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    const result = await CustomerService.getPaymentHistoryDetail(accountId, bookingId);
    res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, result));
  });

  static redeemPointsForVoucher = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const accountId = req.user!.accountId;
    const { pointCost } = req.body;

    if (!pointCost || ![50, 75, 100].includes(Number(pointCost))) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    const result = await CustomerService.redeemPointsForVoucher(accountId, Number(pointCost));
    res.status(201).json(ApiResponse.success(ResponseCode.SUCCESS, result));
  });
}
