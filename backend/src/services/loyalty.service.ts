import sql from 'mssql';
import { getPool } from '../config/database';

export class LoyaltyService {
  /**
   * Cong diem tich luy sau khi thanh toan thanh cong.
   * Logic: 10,000 VND = 1 diem.
   * Co ghi lich su va chan cong trung neu webhook bi gui lai cho cung BookingID.
   */
  static async addPointsFromPayment(customerId: number, amount: number, bookingId?: number): Promise<number> {
    const pointsToAdd = Math.floor(amount / 10000);

    if (pointsToAdd <= 0) return 0;

    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    let transactionActive = false;

    try {
      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      transactionActive = true;

      if (bookingId) {
        const existingHistory = await new sql.Request(transaction)
          .input('CustomerID', sql.Int, customerId)
          .input('BookingID', sql.Int, bookingId)
          .query(`
            SELECT TOP 1 HistoryID
            FROM LoyaltyPointHistory WITH (UPDLOCK, HOLDLOCK)
            WHERE CustomerID = @CustomerID
              AND BookingID = @BookingID
              AND Type = 'EARN'
          `);

        if (existingHistory.recordset.length > 0) {
          await transaction.commit();
          transactionActive = false;
          return 0;
        }
      }

      await new sql.Request(transaction)
        .input('CustomerID', sql.Int, customerId)
        .input('PointsToAdd', sql.Int, pointsToAdd)
        .query(`
          UPDATE Customer
          SET LoyaltyPoints = ISNULL(LoyaltyPoints, 0) + @PointsToAdd
          WHERE CustomerID = @CustomerID
        `);

      await new sql.Request(transaction)
        .input('CustomerID', sql.Int, customerId)
        .input('BookingID', sql.Int, bookingId ?? null)
        .input('Points', sql.Int, pointsToAdd)
        .input('Description', sql.NVarChar(255), `Cong ${pointsToAdd} diem tu thanh toan don hang #${bookingId ?? ''}`.trim())
        .query(`
          INSERT INTO LoyaltyPointHistory (CustomerID, BookingID, Points, Type, Description, CreatedAt)
          VALUES (@CustomerID, @BookingID, @Points, 'EARN', @Description, GETDATE())
        `);

      await transaction.commit();
      transactionActive = false;
    } catch (error) {
      if (transactionActive) {
        await transaction.rollback();
      }
      throw error;
    }

    return pointsToAdd;
  }
}
