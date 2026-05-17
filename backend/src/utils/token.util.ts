import jwt from 'jsonwebtoken';
import redisClient from '../config/redis';

export class TokenUtil {
  /**
   * Tính toán thời gian sống (TTL) còn lại của token (theo giây).
   * Nếu không có thông tin exp, trả về fallback.
   */
  static getRedisTTLFromExp(exp?: number, fallbackSeconds: number = 900): number {
    if (!exp) return fallbackSeconds;
    
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now;
    
    return ttl > 0 ? ttl : 0;
  }

  /**
   * Đưa token vào danh sách đen (Blacklist) trên Redis
   */
  static async blacklistToken(token: string, type: 'access' | 'refresh', exp?: number) {
    const fallback = type === 'access' ? 900 : 7 * 24 * 60 * 60; // 15 phút hoặc 7 ngày
    const ttl = this.getRedisTTLFromExp(exp, fallback);
    
    if (ttl > 0) {
      try {
        const key = `jwt:blacklist:${type}:${token}`;
        await redisClient.setex(key, ttl, 'blacklisted');
      } catch (err) {
        // Redis không khả dụng — bỏ qua blacklist (chấp nhận rủi ro ở môi trường dev)
        console.warn('[⚠️ Redis] Không thể blacklist token (Redis chưa kết nối)');
      }
    }
  }

  /**
   * Kiểm tra xem token có nằm trong blacklist không
   */
  static async isTokenBlacklisted(token: string, type: 'access' | 'refresh'): Promise<boolean> {
    try {
      const key = `jwt:blacklist:${type}:${token}`;
      const result = await redisClient.get(key);
      return result !== null;
    } catch (err) {
      // Redis không khả dụng — coi như token chưa bị blacklist (cho phép qua)
      console.warn('[⚠️ Redis] Không thể kiểm tra blacklist (Redis chưa kết nối)');
      return false;
    }
  }
  
  /**
   * Decode token để lấy thông tin mà không verify signature
   * Dùng cho việc lấy exp khi logout mà token có thể đã hết hạn nhưng vẫn muốn đưa vào blacklist
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
