import sql from 'mssql';
import { getPool } from '../config/database';

export class LoyaltyService {
  /**
   * Tính toán và cộng điểm tích lũy cho khách hàng sau khi thanh toán thành công.
   * Logic: 10,000 VND = 1 điểm.
   * @param customerId ID của khách hàng
   * @param amount Số tiền thanh toán thực tế
   */
  static async addPointsFromPayment(customerId: number, amount: number): Promise<number> {
    const pointsToAdd = Math.floor(amount / 10000);
    
    if (pointsToAdd <= 0) return 0;

    const pool = getPool();
    await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('PointsToAdd', sql.Int, pointsToAdd)
      .query(`
        UPDATE Customer 
        SET LoyaltyPoints = LoyaltyPoints + @PointsToAdd
        WHERE CustomerID = @CustomerID
      `);
      
    // Có thể ghi thêm vào bảng LoyaltyHistory ở đây nếu có

    return pointsToAdd;
  }
}
