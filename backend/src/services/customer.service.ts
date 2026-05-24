import { CustomerModel, UpdateCustomerPayload } from '../models/customer.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';
import { VoucherModel } from '../models/voucher.model';
import { getPool } from '../config/database';
import * as sql from 'mssql';

export class CustomerService {
  /**
   * Truy xuất thông tin Profile cá nhân dựa trên AccountID của phiên đăng nhập hiện tại
   */
  static async getProfile(accountId: number) {
    const profile = await CustomerModel.findByAccountId(accountId);
    
    // Đề phòng trường hợp database lỗi sinh ra Account nhưng chưa sinh Customer record
    if (!profile) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }
    
    return profile;
  }

  /**
   * Cập nhật thông tin Profile cá nhân.
   * Lớp service xử lý để có thể kiểm tra lỗi nếu tài khoản không tồn tại.
   */
  static async updateProfile(accountId: number, data: UpdateCustomerPayload) {
    try {
      // 1. Normalize and validate Gender
      if (data.Gender) {
        const genderUpper = data.Gender.toUpperCase();
        if (genderUpper === 'NAM' || genderUpper === 'MALE') {
          data.Gender = 'MALE';
        } else if (genderUpper === 'NỮ' || genderUpper === 'FEMALE') {
          data.Gender = 'FEMALE';
        } else if (genderUpper === 'KHÁC' || genderUpper === 'OTHER') {
          data.Gender = 'OTHER';
        } else {
          throw new AppException(ErrorCode.INVALID_DATA);
        }
      }

      // 2. Trim and validate PhoneNumber
      if (data.PhoneNumber) {
        data.PhoneNumber = data.PhoneNumber.trim();
        const vnf_regex = /^(0|\+84)(3|5|7|8|9|1[2|6|8|9])([0-9]{8})$/;
        if (!vnf_regex.test(data.PhoneNumber)) {
            // throw new AppException(ErrorCode.INVALID_DATA); 
            // Let's be less strict on backend if mobile already validated, 
            // but at least check length
            if (data.PhoneNumber.length < 8 || data.PhoneNumber.length > 15) {
                throw new AppException(ErrorCode.INVALID_DATA);
            }
        }
      }

      // 3. Normalize DateOfBirth to Date object
      if (data.DateOfBirth) {
          if (typeof data.DateOfBirth === 'string') {
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (!dateRegex.test(data.DateOfBirth)) {
                  throw new AppException(ErrorCode.INVALID_DATA);
              }
              const d = new Date(data.DateOfBirth);
              if (isNaN(d.getTime())) {
                  throw new AppException(ErrorCode.INVALID_DATA);
              }
              data.DateOfBirth = d;
          }
      }

      const updatedProfile = await CustomerModel.updateProfileByAccountId(accountId, data);
      
      if (!updatedProfile) {
        throw new AppException(ErrorCode.USER_NOT_EXISTED);
      }
      
      return updatedProfile;
    } catch (error: any) {
      if (error instanceof AppException) throw error;

      if (error.message && (error.message.includes('UX_Customer_PhoneNumber') || error.message.includes('UNIQUE KEY'))) {
        throw new AppException(ErrorCode.PHONE_NUMBER_EXISTED);
      }
      
      if (error.message && error.message.includes('CK__Customer__Gender')) {
        throw new AppException(ErrorCode.INVALID_DATA);
      }
      
      if (error.number === 1934) {
        console.error('[⚠️ SQL 1934] Lỗi thiết lập SET options (QUOTED_IDENTIFIER, ANSI_NULLS, etc.) khi làm việc với Filtered Index hoặc Trigger.');
      }

      throw error;
    }
  }

  /**
   * Lấy điểm tích lũy và lịch sử điểm của khách hàng hiện tại.
   */
  static async getLoyaltyPoints(accountId: number, page: number = 1, limit: number = 20) {
    const profile = await CustomerModel.findByAccountId(accountId);
    if (!profile) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }
    const customerId = profile.CustomerID;
    const pool = getPool();
    const offset = (page - 1) * limit;

    const pointsResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query('SELECT LoyaltyPoints FROM Customer WHERE CustomerID = @CustomerID');
    const currentPoints = pointsResult.recordset[0]?.LoyaltyPoints ?? 0;

    const historyResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('Offset', sql.Int, offset)
      .input('Limit', sql.Int, limit)
      .query(`
        SELECT HistoryID, Points, Type, Description, CreatedAt, BookingID
        FROM LoyaltyPointHistory
        WHERE CustomerID = @CustomerID
        ORDER BY CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `);

    const countResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query('SELECT COUNT(*) AS Total FROM LoyaltyPointHistory WHERE CustomerID = @CustomerID');

    const total = countResult.recordset[0]?.Total ?? 0;

    return {
      currentPoints,
      history: historyResult.recordset,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Lấy danh sách voucher của khách hàng hiện tại (kho voucher cá nhân).
   */
  static async getMyVouchers(accountId: number) {
    const profile = await CustomerModel.findByAccountId(accountId);
    if (!profile) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }
    const customerId = profile.CustomerID;

    const pool = getPool();
    const result = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query(`
        SELECT
          v.VoucherID,
          v.Code,
          v.DiscountType,
          v.DiscountValue,
          v.MaxDiscount,
          v.StartDate,
          v.EndDate,
          v.IsActive,
          v.UsageLimit,
          v.UsageCount,
          v.MinTicketQty,
          v.MinOrderValue,
          v.ApplicableFormat,
          vc.AssignedAt
        FROM Voucher v
        INNER JOIN VoucherCustomer vc ON v.VoucherID = vc.VoucherID
        WHERE vc.CustomerID = @CustomerID
        ORDER BY v.EndDate ASC
      `);

    return result.recordset;
  }
}
