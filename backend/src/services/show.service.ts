import sql from 'mssql';
import { getPool } from '../config/database';
import ShowModel from '../models/show.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';

/**
 * Lấy chi tiết suất chiếu
 */
export const getById = async (id: number) => {
  const show = await ShowModel.findById(id);
  if (!show) {
    throw new AppException(ErrorCode.SHOW_NOT_FOUND);
  }
  return show;
};

/**
 * Lấy sơ đồ ghế cho suất chiếu (kèm trạng thái từ Redis realtime)
 */
export const getSeatsByShowId = async (showId: number) => {
  const seatData = await ShowModel.getSeatsByShowId(showId);
  if (!seatData) {
    throw new AppException(ErrorCode.SHOW_NOT_FOUND);
  }
  
  // TODO: Kết hợp trạng thái từ Redis (HOLDING từ Redis)
  // Hiện tại trả về trạng thái từ DB (BOOKED) và Redis sẽ được xử lý qua WebSocket/Socket.IO
  
  return seatData;
};

/**
 * Lấy danh sách suất chiếu theo rạp
 */
export const getByCinemaId = async (cinemaId: number, filters: any = {}) => {
  const shows = await ShowModel.getByCinemaId(cinemaId, filters);
  return shows;
};

/**
 * Tạo suất chiếu mới (Admin)
 */
export const create = async (showData: any) => {
  // Kiểm tra phim tồn tại
  // TODO: Kiểm tra movie tồn tại through movie model
  
  // Kiểm tra phòng chiếu tồn tại
  const pool = getPool();
  const hallCheck = await pool.request()
    .input('hallId', sql.Int, showData.hallId)
    .query('SELECT 1 FROM CinemaHall WHERE HallID = @hallId');
  
  if (!hallCheck.recordset[0]) {
    throw new AppException(ErrorCode.HALL_NOT_FOUND);
  }
  
  // Tính endTime nếu chưa có
  if (!showData.endTime && showData.showTime) {
    // Lấy runtime từ movie - tạm thời giả sử 120 phút
    const runtime = 120;
    const startTime = new Date(`1970-01-01T${showData.showTime}`);
    const endTime = new Date(startTime.getTime() + runtime * 60000 + 15 * 60000);
    showData.endTime = endTime.toTimeString().split(' ')[0];
  }
  
  const show = await ShowModel.create(showData);
  return show;
};

/**
 * Cập nhật suất chiếu (Admin)
 */
export const update = async (id: number, showData: any) => {
  const show = await ShowModel.update(id, showData);
  if (!show) {
    throw new AppException(ErrorCode.SHOW_NOT_FOUND);
  }
  return show;
};

/**
 * Xóa suất chiếu (Admin)
 */
export const deleteShow = async (id: number) => {
  const show = await ShowModel.findById(id);
  if (!show) {
    throw new AppException(ErrorCode.SHOW_NOT_FOUND);
  }
  
  await ShowModel.delete(id);
  return show;
};

/**
 * Tính giá vé (BasePrice + Surcharges theo SystemSettings)
 */
export const calculateTicketPrice = async (showId: number, seatId: number) => {
  // Lấy thông tin suất chiếu
  const show = await ShowModel.findById(showId);
  if (!show) {
    throw new AppException(ErrorCode.SHOW_NOT_FOUND);
  }
  
  // Lấy thông tin ghế
  const pool = getPool();
  const seatResult = await pool.request()
    .input('hallId', sql.Int, show.HallID)
    .input('seatId', sql.Int, seatId)
    .query('SELECT * FROM CinemaHallSeat WHERE HallID = @hallId AND SeatID = @seatId');
  
  if (!seatResult.recordset[0]) {
    throw new AppException(ErrorCode.USER_NOT_EXISTED); // TODO: Thêm SEAT_NOT_FOUND
  }
  
  const seat = seatResult.recordset[0];
  
  // TODO: Implement đầy đủ theo business rules từ SystemSettings
  // BasePrice + WeekendSurcharge + FormatSurcharge + SeatSurcharge
  let totalPrice = show.BasePrice;
  
  // Thêm phụ thu loại ghế
  if (seat.SeatType === 'VIP') {
    totalPrice += 30000; // SEAT_VIP_SURCHARGE from SystemSettings
  } else if (seat.SeatType === 'COUPLE') {
    totalPrice += 50000; // SEAT_COUPLE_SURCHARGE from SystemSettings
  }
  
  // TODO: Thêm phụ thu cuối tuần và định dạng
  const surcharges = totalPrice - show.BasePrice;
  
  return {
    basePrice: show.BasePrice,
    seatPrice: seat.SeatPrice,
    surcharges: surcharges,
    totalPrice: totalPrice,
    seatType: seat.SeatType
  };
};
