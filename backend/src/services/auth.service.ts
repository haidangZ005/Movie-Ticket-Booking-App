import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

import { AccountModel, AccountPayload } from '../models/account.model';
import { CustomerModel } from '../models/customer.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';
import sql from 'mssql';
import { getPool } from '../config/database';
import redisClient from '../config/redis';
import { jwtConfig } from '../config/jwt';
import { EmailService } from './email.service';
import { TokenUtil } from '../utils/token.util';

export class AuthService {
  /**
   * Helper sinh cặp Access Token và Refresh Token với JTI duy nhất.
   */
  private static generateAuthTokens(payload: { accountId: number, accountType: string, customerId: number }) {
    const accessToken = jwt.sign(
      { ...payload, jti: randomUUID() },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn as any }
    );
    const refreshToken = jwt.sign(
      { ...payload, jti: randomUUID() },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn as any }
    );
    return { accessToken, refreshToken };
  }

  /**
   * Đăng ký có sử dụng OTP
   * Thay vì tạo cứng vào DB, ta sẽ sinh OTP, băm mật khẩu và lưu tạm ở Redis.
   * OTP có giá trị trong 5 phút. Đồng thời gửi mail ngay lập tức.
   */
  static async registerWithOtp(emailRaw: string, passwordRaw: string) {
    const email = emailRaw.trim().toLowerCase();

    // 1. Kiểm tra tài khoản tồn tại chưa (tranh thủ block sớm)
    const existing = await AccountModel.findByEmail(email);
    if (existing) {
      throw new AppException(ErrorCode.USER_EXISTED);
    }

    // 2. Kiểm tra Throttle (Chống Spam OTP)
    const throttleKey = `otp:throttle:${email}`;
    const attempts = await redisClient.incr(throttleKey);
    if (attempts === 1) {
      await redisClient.expire(throttleKey, 900); // 15 phút
    }
    if (attempts > 3) {
      throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
    }

    // 3. Hash password chuẩn bị lưu tạm
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordRaw, salt);

    // 4. Sinh OTP gồm 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Băm OTP trước khi lưu
    const otpHash = await bcrypt.hash(otp, salt);

    // 5. Lưu Cache vào Redis, cho hết hạn sau 300 giây (5 phút)
    const payload = JSON.stringify({ email, passwordHash, otpHash, accountType: 'CUSTOMER' });
    const redisKey = `otp:register:${email}`;
    await redisClient.setex(redisKey, 300, payload);

    // 6. Gửi thư điện tử chứa OTP cho khách
    try {
      await EmailService.sendOtpEmail(email, otp);
    } catch (error: any) {
      // Gửi mail thất bại thì dọn dẹp Redis để người dùng thử lại ngay lập tức
      await redisClient.del(redisKey);
      await redisClient.decr(throttleKey); // Hoàn lại lượt thử
      throw error;
    }

    return { email };
  }

  /**
   * Xác thực mã OTP và Cấp phát tài khoản thật dưới CSDL.
   */
  static async verifyOtp(emailRaw: string, otp: string) {
    const email = emailRaw.trim().toLowerCase();
    const redisKey = `otp:register:${email}`;

    // 1. Lên Redis lấy mã về
    const data = await redisClient.get(redisKey);
    if (!data) {
      throw new AppException(ErrorCode.INVALID_OTP);
    }

    const parsed = JSON.parse(data);

    // 2. So khớp OTP đã băm
    const isValidOtp = await bcrypt.compare(otp, parsed.otpHash);
    if (!isValidOtp) {
      throw new AppException(ErrorCode.INVALID_OTP);
    }

    // 3. Đúng rồi! Dữ liệu hợp lệ -> Kiểm tra lại Account tồn tại chưa trước khi ghi
    const existing = await AccountModel.findByEmail(email);
    if (existing) {
      await redisClient.del(redisKey);
      throw new AppException(ErrorCode.USER_EXISTED);
    }

    const accountPayload: AccountPayload = {
      Email: parsed.email,
      PasswordHash: parsed.passwordHash,
      AccountType: parsed.accountType || 'CUSTOMER',
      IsVerified: 1
    };

    // 3. Thực hiện lưu vào DB sử dụng Transaction để đảm bảo tính toàn vẹn (Atomic)
    // Account và Customer phải luôn đi kèm với nhau.
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    let isTransactionActive = false;

    try {
      await transaction.begin();
      isTransactionActive = true;

      const createdAccount = await AccountModel.create(accountPayload, transaction);
      const createdCustomer = await CustomerModel.create(createdAccount.AccountID, transaction);

      await transaction.commit();
      isTransactionActive = false;

      // 4. Phi tang vết tích OTP trên Memory - CHỈ khi DB đã commit thành công
      await redisClient.del(redisKey);

      return {
        accountId: createdAccount.AccountID,
        customerId: createdCustomer.CustomerID,
        email: createdAccount.Email,
      };
    } catch (error) {
      // Nếu có bất kỳ lỗi nào (DB unique constraint, v.v.), rollback lại toàn bộ
      if (isTransactionActive) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          // Ignore rollback errors if already aborted/finished
        }
      }
      throw error;
    }
  }

  /**
   * Đăng nhập cơ bản (Chưa OTP)
   * Kiểm tra thông tin, hash và trả về JWT Access Token (Dữ liệu tối thiểu).
   */
  static async loginBasic(email: string, passwordRaw: string) {
    // 0. Chuẩn hóa email
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Kiểm tra tài khoản
    const account = await AccountModel.findByEmail(normalizedEmail);
    if (!account) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    // Reject login when IsVerified is false after OTP flow is implemented.
    if (!account.IsVerified) {
      throw new AppException(ErrorCode.UNVERIFIED_ACCOUNT);
    }

    // 2. Chặn tài khoản bị vô hiệu hóa
    if (!account.IsActive) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    // 3. Đối chiếu mật khẩu
    const isMatch = await bcrypt.compare(passwordRaw, account.PasswordHash);
    if (!isMatch) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    // Fetch customer record
    const customer = await CustomerModel.findByAccountId(account.AccountID);
    if (!customer) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    // 4. Khởi tạo Access Token và Refresh Token (Có JTI duy nhất)
    const { accessToken, refreshToken } = this.generateAuthTokens({
      accountId: account.AccountID,
      accountType: account.AccountType,
      customerId: customer.CustomerID,
    });
    
    // 5. Trả về thông tin tối thiểu (không chứa PasswordHash)
    return {
      accountId: account.AccountID,
      customerId: customer.CustomerID,
      accountType: account.AccountType,
      accessToken,
      refreshToken
    };
  }

  /**
   * Cấp lại Access Token mới dựa vào Refresh Token
   */
  static async refreshToken(oldRefreshToken: string) {
    // 1. Kiểm tra blacklist
    const isBlacklisted = await TokenUtil.isTokenBlacklisted(oldRefreshToken, 'refresh');
    if (isBlacklisted) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    try {
      // 2. Xác thực Refresh Token
      const decoded = jwt.verify(oldRefreshToken, jwtConfig.refreshSecret) as any;
      
      // 3. Khởi tạo Access Token và Refresh Token mới
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = this.generateAuthTokens({
        accountId: decoded.accountId,
        accountType: decoded.accountType,
        customerId: decoded.customerId,
      });

      // 4. Blacklist Refresh Token cũ
      await TokenUtil.blacklistToken(oldRefreshToken, 'refresh', decoded.exp);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
  }

  /**
   * Đăng xuất: Đưa cả Access Token và Refresh Token (nếu có) vào Blacklist
   */
  static async logout(accessToken: string, refreshToken?: string) {
    // 1. Decode access token để lấy exp, sau đó blacklist
    const decodedAccess = TokenUtil.decodeToken(accessToken);
    await TokenUtil.blacklistToken(accessToken, 'access', decodedAccess?.exp);

    // 2. Nếu có refresh token thì đưa vào blacklist
    if (refreshToken) {
      const decodedRefresh = TokenUtil.decodeToken(refreshToken);
      await TokenUtil.blacklistToken(refreshToken, 'refresh', decodedRefresh?.exp);
    }

    return { success: true };
  }

  /**
   * Quên mật khẩu: Gửi OTP xác thực
   */
  static async forgotPassword(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();

    // 1. Kiểm tra Throttle
    const throttleKey = `otp:reset:throttle:${email}`;
    const attempts = await redisClient.incr(throttleKey);
    if (attempts === 1) {
      await redisClient.expire(throttleKey, 900); // 15 phút
    }
    if (attempts > 3) {
      throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
    }

    // 2. Kiểm tra tài khoản
    const account = await AccountModel.findByEmail(email);
    if (!account) {
      // Không ném lỗi để tránh dò tìm email
      return { success: true };
    }

    // 3. Sinh và hash OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // 4. Lưu cache
    const redisKey = `otp:reset:${email}`;
    await redisClient.setex(redisKey, 300, otpHash);

    // 5. Gửi email
    try {
      await EmailService.sendResetPasswordOtpEmail(email, otp);
    } catch (error: any) {
      await redisClient.del(redisKey);
      await redisClient.decr(throttleKey);
      throw error;
    }

    return { success: true };
  }

  /**
   * Xác thực mã OTP đặt lại mật khẩu
   */
  static async verifyResetOtp(emailRaw: string, otp: string) {
    const email = emailRaw.trim().toLowerCase();
    const redisKey = `otp:reset:${email}`;

    // 1. Lấy mã băm OTP từ cache
    const cachedOtpHash = await redisClient.get(redisKey);
    if (!cachedOtpHash) {
      throw new AppException(ErrorCode.INVALID_OTP);
    }

    // 2. So sánh OTP
    const isValid = await bcrypt.compare(otp, cachedOtpHash);
    if (!isValid) {
      throw new AppException(ErrorCode.INVALID_OTP);
    }

    // 3. Đúng rồi! Lưu phiên xác thực thành công vào Redis trong 5 phút
    const verifiedKey = `otp:reset:verified:${email}`;
    await redisClient.setex(verifiedKey, 300, 'true');

    return { success: true };
  }

  /**
   * Đặt lại mật khẩu (sau khi đã xác thực OTP)
   */
  static async resetPassword(emailRaw: string, newPasswordRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    const verifiedKey = `otp:reset:verified:${email}`;

    // 1. Kiểm tra phiên xác thực
    const isVerified = await redisClient.get(verifiedKey);
    if (!isVerified) {
      throw new AppException(ErrorCode.RESET_OTP_NOT_VERIFIED);
    }

    // 2. Lấy tài khoản
    const account = await AccountModel.findByEmail(email);
    if (!account) {
      await redisClient.del(verifiedKey);
      await redisClient.del(`otp:reset:${email}`);
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    // 3. Hash mật khẩu mới và lưu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPasswordRaw, salt);
    await AccountModel.updatePasswordHash(account.AccountID, passwordHash);

    // 4. Dọn dẹp cache
    await redisClient.del(verifiedKey);
    await redisClient.del(`otp:reset:${email}`);

    return { success: true };
  }

  /**
   * Đổi mật khẩu (dành cho người dùng đã đăng nhập)
   */
  static async changePassword(accountId: number, oldPasswordRaw: string, newPasswordRaw: string, accessToken: string, refreshToken?: string) {
    // 1. Lấy thông tin tài khoản
    const account = await AccountModel.findById(accountId);
    if (!account) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    // 2. Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPasswordRaw, account.PasswordHash);
    if (!isMatch) {
      throw new AppException(ErrorCode.INVALID_OLD_PASSWORD);
    }

    // 3. Lưu mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPasswordRaw, salt);
    await AccountModel.updatePasswordHash(accountId, passwordHash);

    // 4. Đưa token hiện tại vào blacklist
    await this.logout(accessToken, refreshToken);

    return { success: true };
  }
}
