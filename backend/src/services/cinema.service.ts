import sql from 'mssql';
import { getPool } from '../config/database';
import CinemaModel from '../models/cinema.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';

interface CinemaFilters {
  cityId?: number;
  name?: string;
  isActive?: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  filters?: CinemaFilters;
}

class CinemaService {
  /**
   * Lấy danh sách cụm rạp có phân trang
   */
  static async getAll({ page = 1, limit = 20, filters = {} }: PaginationOptions) {
    const offset = (page - 1) * limit;
    return await CinemaModel.findAll({ offset, limit, filters });
  }

  /**
   * Lấy chi tiết cụm rạp kèm phòng chiếu
   */
  static async getById(id: number) {
    const cinema = await CinemaModel.findById(id);
    if (!cinema) {
      throw new AppException(ErrorCode.CINEMA_NOT_FOUND);
    }
    return cinema;
  }

  /**
   * Lấy danh sách rạp theo thành phố
   */
  static async getByCity(cityId: number) {
    const pool = getPool();
    const result = await pool.request()
      .input('cityId', sql.Int, cityId)
      .query(`
        SELECT c.*, ct.CityName 
        FROM CinemaComplex c
        JOIN City ct ON c.CityID = ct.CityID
        WHERE c.CityID = @cityId AND c.IsActive = 1
        ORDER BY c.CinemaName
      `);
    return result.recordset;
  }

  /**
   * Lấy tất cả thành phố
   */
  static async getAllCities() {
    const pool = getPool();
    const result = await pool.request()
      .query('SELECT * FROM City ORDER BY CityName');
    return result.recordset;
  }

  /**
   * Thêm cụm rạp mới (Admin)
   */
  static async create(cinemaData: any) {
    // Kiểm tra thành phố tồn tại
    const pool = getPool();
    const cityCheck = await pool.request()
      .input('cityId', sql.Int, cinemaData.cityId)
      .query('SELECT 1 FROM City WHERE CityID = @cityId');

    if (!cityCheck.recordset[0]) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED); // TODO: Thêm CITY_NOT_FOUND
    }

    this.validateCinemaData(cinemaData);
    return await CinemaModel.create(cinemaData);
  }

  /**
   * Cập nhật cụm rạp (Admin)
   */
  static async update(id: number, cinemaData: any) {
    await this.getById(id); // Kiểm tra tồn tại
    this.validateCinemaData(cinemaData, false);
    return await CinemaModel.update(id, cinemaData);
  }

  /**
   * Xóa mềm cụm rạp (Admin)
   */
  static async delete(id: number) {
    await this.getById(id); // Kiểm tra tồn tại
    return await CinemaModel.softDelete(id);
  }

  /**
   * Lấy danh sách phòng chiếu theo rạp
   */
  static async getHallsByCinema(cinemaId: number) {
    return await CinemaModel.getHallsByCinemaId(cinemaId);
  }

  /**
   * Lấy chi tiết phòng chiếu kèm sơ đồ ghế
   */
  static async getHallById(hallId: number) {
    const hall = await CinemaModel.getHallById(hallId);
    if (!hall) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED); // TODO: Thêm HALL_NOT_FOUND
    }
    return hall;
  }

  /**
   * Tạo phòng chiếu mới (Admin)
   */
  static async createHall(hallData: any) {
    this.validateHallData(hallData);
    return await CinemaModel.createHall(hallData);
  }

  /**
   * Cập nhật sơ đồ ghế cho phòng chiếu (Admin)
   */
  static async updateHallSeats(hallId: number, seats: any[]) {
    await this.getHallById(hallId); // Kiểm tra tồn tại
    return await CinemaModel.updateSeats(hallId, seats);
  }

  /**
   * Validate dữ liệu cụm rạp
   */
  private static validateCinemaData(data: any, isCreate: boolean = true) {
    if (isCreate) {
      if (!data.cinemaName) throw this.createValidationError('Tên cụm rạp là bắt buộc', 'CINEMA_NAME_REQUIRED');
      if (!data.cityId) throw this.createValidationError('Thành phố là bắt buộc', 'CITY_REQUIRED');
    }

    if (data.latitude !== undefined && (isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90)) {
      throw this.createValidationError('Vĩ độ không hợp lệ', 'INVALID_LATITUDE');
    }

    if (data.longitude !== undefined && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180)) {
      throw this.createValidationError('Kinh độ không hợp lệ', 'INVALID_LONGITUDE');
    }
  }

  /**
   * Validate dữ liệu phòng chiếu
   */
  private static validateHallData(data: any) {
    if (!data.hallName) throw this.createValidationError('Tên phòng chiếu là bắt buộc', 'HALL_NAME_REQUIRED');
    if (!data.cinemaId) throw this.createValidationError('Cụm rạp là bắt buộc', 'CINEMA_REQUIRED');
    if (!data.totalRows || data.totalRows < 1) throw this.createValidationError('Số hàng phải >= 1', 'INVALID_TOTAL_ROWS');
    if (!data.totalCols || data.totalCols < 1) throw this.createValidationError('Số cột phải >= 1', 'INVALID_TOTAL_COLS');
  }

  private static createValidationError(message: string, errorCode: string) {
    const error: any = new Error(message);
    error.statusCode = 400;
    error.errorCode = errorCode;
    return error;
  }
}

export default CinemaService;
