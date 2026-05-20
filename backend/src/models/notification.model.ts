import sql from 'mssql';
import { getPool } from '../config/database';

export type NotificationType = 'BOOKING' | 'PAYMENT' | 'REMINDER' | 'VOUCHER' | 'SYSTEM';

export interface CreateNotificationPayload {
  customerId: number;
  title: string;
  body: string;
  type: NotificationType;
}

export interface Notification {
  NotificationID: number;
  CustomerID: number;
  Title: string;
  Body: string;
  Type: NotificationType;
  IsRead: boolean;
  CreatedAt: Date;
}

/**
 * Model thao tác trực tiếp với bảng Notification trong SQL Server.
 * Được gọi bởi NotificationService — không chứa business logic.
 */
export class NotificationModel {
  /**
   * Tạo một thông báo mới cho khách hàng.
   * Dùng OUTPUT INSERTED để lấy ngay bản ghi vừa tạo.
   */
  static async create(data: CreateNotificationPayload): Promise<Notification> {
    const pool = getPool();
    const result = await pool.request()
      .input('CustomerID', sql.Int, data.customerId)
      .input('Title', sql.NVarChar(100), data.title)
      .input('Body', sql.NVarChar(500), data.body)
      .input('Type', sql.NVarChar(30), data.type)
      .query(`
        INSERT INTO Notification (CustomerID, Title, Body, Type, IsRead, CreatedAt)
        OUTPUT
          INSERTED.NotificationID,
          INSERTED.CustomerID,
          INSERTED.Title,
          INSERTED.Body,
          INSERTED.Type,
          INSERTED.IsRead,
          INSERTED.CreatedAt
        VALUES (@CustomerID, @Title, @Body, @Type, 0, GETDATE())
      `);

    return result.recordset[0];
  }

  /**
   * Lấy danh sách thông báo của một khách hàng (mới nhất trước), có phân trang.
   */
  static async findByCustomerId(
    customerId: number,
    page: number,
    limit: number
  ): Promise<{ notifications: Notification[]; total: number }> {
    const pool = getPool();
    const offset = (page - 1) * limit;

    const dataResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .input('Offset', sql.Int, offset)
      .input('Limit', sql.Int, limit)
      .query(`
        SELECT
          NotificationID, CustomerID, Title, Body, Type, IsRead, CreatedAt
        FROM Notification
        WHERE CustomerID = @CustomerID
        ORDER BY CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `);

    const countResult = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query(`
        SELECT COUNT(*) AS Total
        FROM Notification
        WHERE CustomerID = @CustomerID
      `);

    return {
      notifications: dataResult.recordset,
      total: countResult.recordset[0]?.Total ?? 0,
    };
  }

  /**
   * Đánh dấu một thông báo đã đọc.
   * Kiểm tra CustomerID để tránh user A đọc thông báo của user B.
   * @returns true nếu cập nhật thành công, false nếu không tìm thấy hoặc không có quyền
   */
  static async markAsRead(notificationId: number, customerId: number): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request()
      .input('NotificationID', sql.Int, notificationId)
      .input('CustomerID', sql.Int, customerId)
      .query(`
        UPDATE Notification
        SET IsRead = 1
        WHERE NotificationID = @NotificationID
          AND CustomerID = @CustomerID
          AND IsRead = 0;

        SELECT @@ROWCOUNT AS AffectedRows;
      `);

    return (result.recordset[0]?.AffectedRows ?? 0) > 0;
  }

  /**
   * Đánh dấu tất cả thông báo chưa đọc của khách hàng là đã đọc.
   * @returns số lượng thông báo được cập nhật
   */
  static async markAllAsRead(customerId: number): Promise<number> {
    const pool = getPool();
    const result = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query(`
        UPDATE Notification
        SET IsRead = 1
        WHERE CustomerID = @CustomerID AND IsRead = 0;

        SELECT @@ROWCOUNT AS AffectedRows;
      `);

    return result.recordset[0]?.AffectedRows ?? 0;
  }

  /**
   * Đếm số thông báo chưa đọc — dùng cho badge count trên Mobile.
   */
  static async getUnreadCount(customerId: number): Promise<number> {
    const pool = getPool();
    const result = await pool.request()
      .input('CustomerID', sql.Int, customerId)
      .query(`
        SELECT COUNT(*) AS UnreadCount
        FROM Notification
        WHERE CustomerID = @CustomerID AND IsRead = 0
      `);

    return result.recordset[0]?.UnreadCount ?? 0;
  }
}
