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
        LEFT JOIN VoucherCustomer vc
          ON v.VoucherID = vc.VoucherID
          AND vc.CustomerID = @CustomerID
        WHERE vc.CustomerID = @CustomerID
          OR NOT EXISTS (
            SELECT 1
            FROM VoucherCustomer vcAny
            WHERE vcAny.VoucherID = v.VoucherID
          )
        ORDER BY v.EndDate ASC
      `);

    return result.recordset;
  }

  static async getPaymentHistory(accountId: number, page: number = 1, limit: number = 20) {
    const profile = await CustomerModel.findByAccountId(accountId);
    if (!profile) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    const customerId = profile.CustomerID;
    const pool = getPool();
    const offset = (page - 1) * limit;

    const historyResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('Offset', sql.Int, offset)
      .input('Limit', sql.Int, limit)
      .query(`
        WITH RankedPayment AS (
          SELECT
            p.*,
            ROW_NUMBER() OVER (
              PARTITION BY p.BookingID
              ORDER BY
                CASE
                  WHEN p.Status = 'SUCCESS' THEN 0
                  WHEN p.Status = 'PENDING_PAYMENT' THEN 1
                  WHEN p.Status = 'CREATED' THEN 2
                  ELSE 3
                END,
                p.PaymentDate DESC,
                p.PaymentID DESC
            ) AS rn
          FROM Payment p
        )
        SELECT
          p.PaymentID,
          p.BookingID,
          p.VoucherID,
          p.Amount,
          p.DiscountAmount,
          p.PaymentMethod,
          p.PaymentDate,
          p.Status AS PaymentStatus,
          p.RefundAmount,
          p.RefundAt,
          b.Status AS BookingStatus,
          b.TotalSeats,
          m.MovieTitle,
          c.CinemaName,
          h.HallName,
          s.ShowDate,
          CONVERT(varchar(5), s.ShowTime, 108) AS ShowTime
        FROM RankedPayment p
        INNER JOIN Booking b ON b.BookingID = p.BookingID
        INNER JOIN [Show] s ON s.ShowID = b.ShowID
        INNER JOIN Movie m ON m.MovieID = s.MovieID
        INNER JOIN CinemaHall h ON h.HallID = s.HallID
        INNER JOIN Cinema c ON c.CinemaID = h.CinemaID
        WHERE b.CustomerID = @CustomerID
          AND p.rn = 1
        ORDER BY p.PaymentDate DESC, p.PaymentID DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `);

    const countResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query(`
        SELECT COUNT(DISTINCT p.BookingID) AS Total
        FROM Payment p
        INNER JOIN Booking b ON b.BookingID = p.BookingID
        WHERE b.CustomerID = @CustomerID
      `);

    const total = countResult.recordset[0]?.Total ?? 0;

    return {
      items: historyResult.recordset,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getPaymentHistoryDetail(accountId: number, bookingId: number) {
    const profile = await CustomerModel.findByAccountId(accountId);
    if (!profile) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    const customerId = profile.CustomerID;
    const pool = getPool();

    const summaryResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('BookingID', sql.Int, bookingId)
      .query(`
        WITH RankedPayment AS (
          SELECT
            p.*,
            ROW_NUMBER() OVER (
              PARTITION BY p.BookingID
              ORDER BY
                CASE
                  WHEN p.Status = 'SUCCESS' THEN 0
                  WHEN p.Status = 'PENDING_PAYMENT' THEN 1
                  WHEN p.Status = 'CREATED' THEN 2
                  ELSE 3
                END,
                p.PaymentDate DESC,
                p.PaymentID DESC
            ) AS rn
          FROM Payment p
        )
        SELECT
          p.PaymentID,
          p.BookingID,
          p.VoucherID,
          p.Amount,
          p.DiscountAmount,
          p.PaymentMethod,
          p.PaymentDate,
          p.Status AS PaymentStatus,
          p.RefundAmount,
          p.RefundAt,
          b.Status AS BookingStatus,
          b.TotalSeats,
          b.TotalAmount,
          m.MovieTitle,
          c.CinemaName,
          h.HallName,
          s.ShowDate,
          CONVERT(varchar(5), s.ShowTime, 108) AS ShowTime
        FROM RankedPayment p
        INNER JOIN Booking b ON b.BookingID = p.BookingID
        INNER JOIN [Show] s ON s.ShowID = b.ShowID
        INNER JOIN Movie m ON m.MovieID = s.MovieID
        INNER JOIN CinemaHall h ON h.HallID = s.HallID
        INNER JOIN Cinema c ON c.CinemaID = h.CinemaID
        WHERE b.CustomerID = @CustomerID
          AND b.BookingID = @BookingID
          AND p.rn = 1
      `);

    const summary = summaryResult.recordset[0];
    if (!summary) {
      throw new AppException(ErrorCode.DATA_NOT_FOUND);
    }

    const seatsResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT
          bs.BookingSeatID,
          bs.SeatID,
          chs.SeatNumber,
          chs.SeatType,
          bs.TicketPrice,
          bs.Status
        FROM BookingSeat bs
        INNER JOIN CinemaHallSeat chs ON chs.SeatID = bs.SeatID
        WHERE bs.BookingID = @BookingID
        ORDER BY chs.RowIndex, chs.ColIndex
      `);

    const productsResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT
          bp.BookingProductID,
          bp.ProductID,
          p.ProductName,
          p.ProductCategory,
          p.ImageProduct,
          bp.Quantity,
          bp.UnitPrice,
          (bp.Quantity * bp.UnitPrice) AS Subtotal
        FROM BookingProduct bp
        INNER JOIN Product p ON p.ProductID = bp.ProductID
        WHERE bp.BookingID = @BookingID
        ORDER BY bp.BookingProductID
      `);

    const ticketTotal = seatsResult.recordset.reduce((sum, seat) => sum + Number(seat.TicketPrice || 0), 0);
    const productTotal = productsResult.recordset.reduce((sum, product) => sum + Number(product.Subtotal || 0), 0);

    return {
      summary,
      seats: seatsResult.recordset,
      products: productsResult.recordset,
      totals: {
        ticketTotal,
        productTotal,
        discountAmount: Number(summary.DiscountAmount || 0),
        paidAmount: Number(summary.Amount || 0),
      },
    };
  }

  /**
   * Đổi điểm tích lũy lấy voucher.
   * Tạo voucher ngẫu nhiên 7 ký tự (chữ + số), lưu vào DB và trừ điểm.
   */
  static async redeemPointsForVoucher(accountId: number, pointCost: number): Promise<{ voucherCode: string; discountPercent: number; expiresAt: Date }> {
    const profile = await CustomerModel.findByAccountId(accountId);
    if (!profile) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }
    const customerId = profile.CustomerID;
    const pool = getPool();

    // 1. Kiểm tra điểm đủ không
    const pointsResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query('SELECT LoyaltyPoints FROM Customer WHERE CustomerID = @CustomerID');
    const currentPoints = pointsResult.recordset[0]?.LoyaltyPoints ?? 0;

    if (currentPoints < pointCost) {
      throw new AppException(ErrorCode.INVALID_DATA);
    }

    // 2. Sinh mã voucher ngẫu nhiên 7 ký tự (chữ + số)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let voucherCode = 'VC';
    for (let i = 0; i < 5; i++) {
      voucherCode += chars[Math.floor(Math.random() * chars.length)];
    }

    // 3. Tính % giảm theo điểm
    let discountPercent = 10;
    if (pointCost === 75) discountPercent = 15;
    if (pointCost === 100) discountPercent = 20;

    // 4. Tính ngày hết hạn: 30 ngày kể từ hôm nay
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 5. Tạo voucher trong DB
    await pool.request()
      .input('Code', sql.NVarChar(50), voucherCode)
      .input('DiscountType', sql.NVarChar(10), 'PERCENT')
      .input('DiscountValue', sql.Decimal(10, 2), discountPercent)
      .input('MaxDiscount', sql.Decimal(10, 2), 100000)
      .input('StartDate', sql.Date, new Date())
      .input('EndDate', sql.Date, expiresAt)
      .input('UsageLimit', sql.Int, 1)
      .input('MinOrderValue', sql.Decimal(10, 2), 50000)
      .query(`
        INSERT INTO Voucher (Code, DiscountType, DiscountValue, MaxDiscount, StartDate, EndDate, UsageLimit, MinOrderValue, IsActive)
        VALUES (@Code, @DiscountType, @DiscountValue, @MaxDiscount, @StartDate, @EndDate, @UsageLimit, @MinOrderValue, 1)
      `);

    // 6. Gán voucher cho customer
    await pool.request()
      .input('Code', sql.NVarChar(50), voucherCode)
      .input('CustomerID', sql.Int, customerId)
      .query(`
        INSERT INTO VoucherCustomer (VoucherID, CustomerID, AssignedAt)
        SELECT VoucherID, @CustomerID, GETDATE()
        FROM Voucher WHERE Code = @Code
      `);

    // 7. Trừ điểm tích lũy
    await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('PointsToDeduct', sql.Int, pointCost)
      .query(`
        UPDATE Customer
        SET LoyaltyPoints = LoyaltyPoints - @PointsToDeduct
        WHERE CustomerID = @CustomerID
      `);

    // 8. Ghi lịch sử điểm
    await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('Points', sql.Int, -pointCost)
      .input('Description', sql.NVarChar(255), `Doi ${pointCost} diem lay voucher giam ${discountPercent}%`)
      .query(`
        INSERT INTO LoyaltyPointHistory (CustomerID, Points, Type, Description, CreatedAt)
        VALUES (@CustomerID, @Points, 'REVOKED', @Description, GETDATE())
      `);

    return { voucherCode, discountPercent, expiresAt };
  }
}
