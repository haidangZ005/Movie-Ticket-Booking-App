import sql from 'mssql';
import { getPool } from '../config/database';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';

// ============================================
// Interface — Cấu trúc kết quả tính giá
// ============================================

export interface PriceBreakdown {
  basePrice: number;
  weekendSurcharge: number;
  formatSurcharge: number;
  seatSurcharge: number;
  totalPrice: number;
  seatType: string;
  format: string;
  isWeekend: boolean;
}

export interface BatchPriceResult {
  seats: PriceBreakdown[];
  grandTotal: number;
}

// ============================================
// Cache nội bộ — Tránh query SystemSettings mỗi request
// ============================================

let settingsCache: Record<string, number> | null = null;
let settingsCacheExpiry = 0;
const SETTINGS_CACHE_TTL_MS = 60_000; // Cache settings trong 1 phút

// ============================================
// PricingService — Tính giá vé theo công thức AGENTS.md
//
// Công thức:
//   TicketPrice = BasePrice + WeekendSurcharge + FormatSurcharge + SeatSurcharge
//
// Tất cả mức phụ thu đọc từ bảng SystemSettings (Admin cấu hình),
// KHÔNG hardcode giá trị cố định trong code.
// ============================================

class PricingService {
  /**
   * Đọc toàn bộ cấu hình phụ thu từ bảng SystemSettings.
   * Có cache nội bộ 1 phút để tránh query liên tục.
   */
  private static async getSettings(): Promise<Record<string, number>> {
    const now = Date.now();

    // Trả cache nếu còn hiệu lực
    if (settingsCache && now < settingsCacheExpiry) {
      return settingsCache;
    }

    const pool = getPool();
    const result = await pool.request().query(`
      SELECT SettingKey, SettingValue
      FROM SystemSettings
      WHERE SettingKey IN (
        'WEEKEND_SURCHARGE',
        'FORMAT_3D_SURCHARGE',
        'FORMAT_IMAX_SURCHARGE',
        'SEAT_VIP_SURCHARGE',
        'SEAT_COUPLE_SURCHARGE'
      )
    `);

    const settings: Record<string, number> = {};
    for (const row of result.recordset) {
      settings[row.SettingKey] = parseFloat(row.SettingValue) || 0;
    }

    // Cập nhật cache
    settingsCache = settings;
    settingsCacheExpiry = now + SETTINGS_CACHE_TTL_MS;

    return settings;
  }

  /**
   * Xóa cache settings (gọi khi Admin cập nhật SystemSettings)
   */
  static invalidateSettingsCache(): void {
    settingsCache = null;
    settingsCacheExpiry = 0;
  }

  /**
   * Kiểm tra ngày có phải cuối tuần (Thứ 7 / Chủ nhật) hay không.
   */
  private static isWeekendDate(date: Date | string): boolean {
    const d = new Date(date);
    const day = d.getDay(); // 0 = CN, 6 = T7
    return day === 0 || day === 6;
  }

  /**
   * Tính phụ thu theo định dạng phim (2D / 3D / IMAX).
   */
  private static getFormatSurcharge(format: string, settings: Record<string, number>): number {
    const upperFormat = (format || '2D').toUpperCase();
    switch (upperFormat) {
      case '3D':
        return settings['FORMAT_3D_SURCHARGE'] || 0;
      case 'IMAX':
        return settings['FORMAT_IMAX_SURCHARGE'] || 0;
      default:
        return 0; // 2D không phụ thu
    }
  }

  /**
   * Tính phụ thu theo loại ghế (STANDARD / VIP / COUPLE).
   */
  private static getSeatSurcharge(seatType: string, settings: Record<string, number>): number {
    const upperType = (seatType || 'STANDARD').toUpperCase();
    switch (upperType) {
      case 'VIP':
        return settings['SEAT_VIP_SURCHARGE'] || 0;
      case 'COUPLE':
        return settings['SEAT_COUPLE_SURCHARGE'] || 0;
      default:
        return 0; // STANDARD không phụ thu
    }
  }

  // ==========================================
  // PUBLIC API — Tính giá cho 1 ghế
  // ==========================================

  /**
   * Tính giá vé chi tiết cho 1 ghế trong 1 suất chiếu.
   * Đọc BasePrice từ bảng Show, phụ thu từ SystemSettings.
   *
   * @param showId  ID suất chiếu
   * @param seatId  ID ghế
   * @returns PriceBreakdown — bảng giá chi tiết
   */
  static async calculateSeatPrice(showId: number, seatId: number): Promise<PriceBreakdown> {
    const pool = getPool();

    // 1. Lấy thông tin suất chiếu (BasePrice, Format, ShowDate)
    const showResult = await pool.request()
      .input('showId', sql.Int, showId)
      .query(`
        SELECT s.BasePrice, s.Format, s.ShowDate, s.HallID
        FROM [Show] s
        WHERE s.ShowID = @showId
      `);

    if (!showResult.recordset[0]) {
      throw new AppException(ErrorCode.SHOW_NOT_FOUND);
    }

    const show = showResult.recordset[0];

    // 2. Lấy thông tin ghế (SeatType)
    const seatResult = await pool.request()
      .input('hallId', sql.Int, show.HallID)
      .input('seatId', sql.Int, seatId)
      .query(`
        SELECT SeatType, IsAisle
        FROM CinemaHallSeat
        WHERE HallID = @hallId AND SeatID = @seatId
      `);

    if (!seatResult.recordset[0]) {
      throw new AppException(ErrorCode.SEAT_NOT_FOUND);
    }

    const seat = seatResult.recordset[0];

    if (seat.IsAisle) {
      throw new AppException(ErrorCode.INVALID_DATA); // Lối đi không thể đặt
    }

    // 3. Đọc phụ thu từ SystemSettings
    const settings = await this.getSettings();

    // 4. Tính từng thành phần
    const basePrice: number = show.BasePrice || 0;
    const isWeekend = this.isWeekendDate(show.ShowDate);
    const weekendSurcharge = isWeekend ? (settings['WEEKEND_SURCHARGE'] || 0) : 0;
    const formatSurcharge = this.getFormatSurcharge(show.Format, settings);
    const seatSurcharge = this.getSeatSurcharge(seat.SeatType, settings);

    // 5. Công thức: BasePrice + WeekendSurcharge + FormatSurcharge + SeatSurcharge
    const totalPrice = basePrice + weekendSurcharge + formatSurcharge + seatSurcharge;

    return {
      basePrice,
      weekendSurcharge,
      formatSurcharge,
      seatSurcharge,
      totalPrice,
      seatType: seat.SeatType,
      format: show.Format,
      isWeekend,
    };
  }

  // ==========================================
  // PUBLIC API — Tính giá cho nhiều ghế (Batch)
  // ==========================================

  /**
   * Tính giá vé cho nhiều ghế cùng lúc (dùng khi khách chọn nhiều ghế).
   *
   * @param showId   ID suất chiếu
   * @param seatIds  Mảng ID ghế
   * @returns BatchPriceResult — giá từng ghế + tổng cộng
   */
  static async calculateBatchPrice(showId: number, seatIds: number[]): Promise<BatchPriceResult> {
    const pool = getPool();

    // 1. Lấy thông tin suất chiếu 1 lần duy nhất
    const showResult = await pool.request()
      .input('showId', sql.Int, showId)
      .query(`
        SELECT s.BasePrice, s.Format, s.ShowDate, s.HallID
        FROM [Show] s
        WHERE s.ShowID = @showId
      `);

    if (!showResult.recordset[0]) {
      throw new AppException(ErrorCode.SHOW_NOT_FOUND);
    }

    const show = showResult.recordset[0];

    // 2. Lấy thông tin tất cả ghế 1 lần duy nhất
    const seatIdsStr = seatIds.join(',');
    const seatsResult = await pool.request()
      .input('hallId', sql.Int, show.HallID)
      .query(`
        SELECT SeatID, SeatType, IsAisle
        FROM CinemaHallSeat
        WHERE HallID = @hallId AND SeatID IN (${seatIdsStr})
      `);

    const seatsMap = new Map<number, any>();
    for (const s of seatsResult.recordset) {
      seatsMap.set(s.SeatID, s);
    }

    // 3. Đọc settings 1 lần duy nhất
    const settings = await this.getSettings();
    const basePrice: number = show.BasePrice || 0;
    const isWeekend = this.isWeekendDate(show.ShowDate);
    const weekendSurcharge = isWeekend ? (settings['WEEKEND_SURCHARGE'] || 0) : 0;
    const formatSurcharge = this.getFormatSurcharge(show.Format, settings);

    // 4. Tính giá từng ghế
    const seats: PriceBreakdown[] = [];
    let grandTotal = 0;

    for (const seatId of seatIds) {
      const seat = seatsMap.get(seatId);
      if (!seat) {
        throw new AppException(ErrorCode.SEAT_NOT_FOUND);
      }
      if (seat.IsAisle) {
        throw new AppException(ErrorCode.INVALID_DATA);
      }

      const seatSurcharge = this.getSeatSurcharge(seat.SeatType, settings);
      const totalPrice = basePrice + weekendSurcharge + formatSurcharge + seatSurcharge;

      seats.push({
        basePrice,
        weekendSurcharge,
        formatSurcharge,
        seatSurcharge,
        totalPrice,
        seatType: seat.SeatType,
        format: show.Format,
        isWeekend,
      });

      grandTotal += totalPrice;
    }

    return { seats, grandTotal };
  }
}

export default PricingService;
