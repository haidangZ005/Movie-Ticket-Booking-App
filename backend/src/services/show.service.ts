import sql from 'mssql';
import { getPool } from '../config/database';
import ShowModel from '../models/show.model';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';
import redisClient from '../config/redis';

const ensureRedisConnected = async () => {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting' || redisClient.status === 'connect') {
    return;
  }

  await redisClient.connect();
};

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

  try {
    await ensureRedisConnected();
    const seats = await Promise.all(seatData.seats.map(async (seat: any) => {
      if (seat.Status === 'BOOKED') return seat;

      const key = `seat:hold:${showId}:${seat.SeatID}`;
      const holder = await redisClient.get(key);
      if (!holder) return seat;

      const ttl = await redisClient.ttl(key);
      return {
        ...seat,
        Status: 'HOLDING',
        HoldBy: Number(holder),
        HoldUntil: ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : null,
      };
    }));

    return {
      ...seatData,
      seats,
    };
  } catch (error) {
    console.warn('[Redis] Cannot merge holding seats into show seat map:', (error as Error).message);
  }

  return seatData;
};

/**
 * Lấy danh sách suất chiếu theo rạp
 */
export const getByCinemaId = async (cinemaId: number, filters: any = {}) => {
  const shows = await ShowModel.getByCinemaId(cinemaId, filters);
  return shows;
};

export const getAll = async (filters: any = {}) => {
  return ShowModel.findAll(filters);
};

export const getDatesByCinemaId = async (cinemaId: number, filters: any = {}) => {
  return ShowModel.getDatesByCinemaId(cinemaId, filters);
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
 * Tính giá vé — Delegate sang PricingService (đọc từ SystemSettings, KHÔNG hardcode)
 */
export const calculateTicketPrice = async (showId: number, seatId: number) => {
  const PricingService = (await import('./pricing.service')).default;
  return PricingService.calculateSeatPrice(showId, seatId);
};

/**
 * Tính giá vé cho nhiều ghế cùng lúc (batch)
 */
export const calculateBatchPrice = async (showId: number, seatIds: number[]) => {
  const PricingService = (await import('./pricing.service')).default;
  return PricingService.calculateBatchPrice(showId, seatIds);
};

export default {
  getById,
  getSeatsByShowId,
  getAll,
  getByCinemaId,
  getDatesByCinemaId,
  create,
  update,
  deleteShow,
  calculateTicketPrice,
  calculateBatchPrice
};
