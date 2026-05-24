import bcrypt from 'bcryptjs';
import redisClient from '../config/redis';

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 300; // 5 phút
const THROTTLE_TTL_SECONDS = 900; // 15 phút
const MAX_ATTEMPTS_PER_WINDOW = 3;

/**
 * Service tập trung toàn bộ logic liên quan đến OTP:
 * sinh mã, lưu Redis (đã hash), xác minh, kiểm soát tần suất.
 *
 * Auth flow:
 *   1. generateAndStore() → sinh OTP → hash → lưu Redis → trả về OTP plaintext (để gửi email)
 *   2. verify() → lấy hash từ Redis → so sánh → xóa Redis nếu đúng
 *
 * Tất cả OTP được hash trước khi lưu (bcrypt) để không lộ nếu Redis bị xâm phạm.
 */
export class OtpService {
  /**
   * Kiểm tra throttle — ngăn spam OTP quá nhiều lần trong cửa sổ thời gian.
   * @returns true nếu đã vượt giới hạn, false nếu còn được phép
   */
  static async isThrottled(purpose: string, identifier: string): Promise<boolean> {
    const key = `otp:throttle:${purpose}:${identifier}`;
    const attempts = await redisClient.incr(key);
    if (attempts === 1) {
      await redisClient.expire(key, THROTTLE_TTL_SECONDS);
    }
    return attempts > MAX_ATTEMPTS_PER_WINDOW;
  }

  /**
   * Giảm bộ đếm throttle — dùng khi cần hoàn lại lượt thử (vd: gửi email thất bại).
   */
  static async decrementThrottle(purpose: string, identifier: string): Promise<void> {
    const key = `otp:throttle:${purpose}:${identifier}`;
    await redisClient.decr(key);
  }

  /**
   * Sinh OTP 6 chữ số, hash bằng bcrypt, lưu vào Redis với TTL 5 phút.
   * @returns OTP dạng plaintext (chỉ dùng để gửi email, không lưu nơi nào khác)
   */
  static async generateAndStore(purpose: string, identifier: string): Promise<string> {
    const otp = Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1))
      .toString();

    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    const key = `otp:${purpose}:${identifier}`;
    await redisClient.setex(key, OTP_TTL_SECONDS, otpHash);

    return otp;
  }

  /**
   * Xác minh OTP người dùng nhập.
   * - Nếu đúng: xóa khỏi Redis (one-time use) và trả về true.
   * - Nếu sai hoặc hết hạn: trả về false.
   */
  static async verify(purpose: string, identifier: string, otp: string): Promise<boolean> {
    const key = `otp:${purpose}:${identifier}`;
    const storedHash = await redisClient.get(key);

    if (!storedHash) return false;

    const isValid = await bcrypt.compare(otp, storedHash);
    if (isValid) {
      await redisClient.del(key);
    }

    return isValid;
  }

  /**
   * Đánh dấu phiên xác minh thành công — dùng cho luồng quên mật khẩu.
   * Sau khi verify OTP, lưu trạng thái "đã xác minh" trong 5 phút để cho phép đặt lại mật khẩu.
   */
  static async markVerified(purpose: string, identifier: string): Promise<void> {
    const key = `otp:verified:${purpose}:${identifier}`;
    await redisClient.setex(key, OTP_TTL_SECONDS, '1');
  }

  /**
   * Kiểm tra xem phiên xác minh còn hiệu lực không.
   */
  static async isVerified(purpose: string, identifier: string): Promise<boolean> {
    const key = `otp:verified:${purpose}:${identifier}`;
    const result = await redisClient.get(key);
    return result === '1';
  }

  /**
   * Xóa trạng thái đã xác minh — gọi sau khi đặt lại mật khẩu thành công.
   */
  static async clearVerified(purpose: string, identifier: string): Promise<void> {
    const key = `otp:verified:${purpose}:${identifier}`;
    await redisClient.del(key);
  }
}
