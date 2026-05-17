import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';
import ShowService from '../../services/show.service';
import CinemaService from '../../services/cinema.service';

// GET /api/shows/:id — Chi tiết suất chiếu
export const getShowById = asyncHandler(async (req: Request, res: Response) => {
  const show = await ShowService.getById(Number(req.params.id));
  return res.status(200).json({ success: true, data: show });
});

// GET /api/shows/:id/seats — Sơ đồ ghế (kèm trạng thái realtime từ Redis)
export const getShowSeats = asyncHandler(async (req: Request, res: Response) => {
  const showId = Number(req.params.id);
  
  // Lấy sơ đồ ghế từ DB
  const seatData = await ShowService.getSeatsByShowId(showId);
  if (!seatData) {
    throw new AppException(ErrorCode.USER_NOT_EXISTED); // TODO: Thêm SHOW_NOT_FOUND
  }
  
  // TODO: Lấy trạng thái từ Redis cache (trạng thái HOLDING từ Redis)
  // Hiện tại trả về trạng thái từ DB, Redis sẽ được xử lý ở service/websocket
  
  return res.status(200).json({ 
    success: true, 
    data: {
      showInfo: seatData.showInfo,
      seats: seatData.seats
    }
  });
});

// GET /api/cinemas/:id/shows — Lịch chiếu theo cụm rạp
export const getShowsByCinema = asyncHandler(async (req: Request, res: Response) => {
  const cinemaId = Number(req.params.id);
  const { movieId, showDate, format } = req.query;
  
  const filters: any = {};
  if (movieId) filters.movieId = Number(movieId);
  if (showDate) filters.showDate = new Date(showDate as string);
  if (format) filters.format = format;
  
  const shows = await ShowService.getByCinemaId(cinemaId, filters);
  return res.status(200).json({ success: true, data: shows });
});

// POST /api/admin/shows — Tạo suất chiếu (Admin, kiểm tra xung đột)
export const createShow = asyncHandler(async (req: Request, res: Response) => {
  const showData = req.body;
  
  // Kiểm tra phòng chiếu tồn tại
  const hall = await CinemaService.getHallById(showData.hallId);
  if (!hall) {
    throw new AppException(ErrorCode.USER_NOT_EXISTED); // TODO: Thêm HALL_NOT_FOUND
  }
  
  // Tính endTime nếu chưa có
  if (!showData.endTime && showData.movieId) {
    // TODO: Lấy runtime từ movie
    // Tạm thời giả sử runtime = 120 phút
    const runtime = 120;
    const startTime = new Date(`1970-01-01T${showData.showTime}`);
    const endTime = new Date(startTime.getTime() + runtime * 60000 + 15 * 60000);
    showData.endTime = endTime.toTimeString().split(' ')[0];
  }
  
  const show = await ShowService.create(showData);
  return res.status(201).json({ success: true, data: show, message: 'Tạo suất chiếu thành công' });
});

// PUT /api/admin/shows/:id — Cập nhật suất chiếu (Admin, chỉ nếu chưa có vé)
export const updateShow = asyncHandler(async (req: Request, res: Response) => {
  const show = await ShowService.update(Number(req.params.id), req.body);
  return res.status(200).json({ success: true, data: show, message: 'Cập nhật suất chiếu thành công' });
});

// DELETE /api/admin/shows/:id — Xóa suất chiếu (Admin, kiểm tra không có vé)
export const deleteShow = asyncHandler(async (req: Request, res: Response) => {
  await ShowService.delete(Number(req.params.id));
  return res.status(200).json({ success: true, data: null, message: 'Xóa suất chiếu thành công' });
});
