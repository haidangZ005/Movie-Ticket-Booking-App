import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';
import CinemaService from '../../services/cinema.service';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';

// GET /api/cinemas — Danh sách cụm rạp (có phân trang)
export const getCinemas = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, cityId } = req.query;
  const filters: Record<string, any> = {};
  if (cityId) filters.cityId = Number(cityId);

  const { cinemas, total } = await CinemaService.getAll({
    page: Number(page),
    limit: Number(limit),
    filters
  });

  return res.status(200).json(ApiResponse.paginate(ResponseCode.SUCCESS, cinemas, {
    page: Number(page),
    limit: Number(limit),
    total
  }));
});

// GET /api/cinemas?cityId= — Lọc cụm rạp theo thành phố
export const getCinemasByCity = asyncHandler(async (req: Request, res: Response) => {
  const { cityId } = req.query;
  if (!cityId) {
    throw new AppException(ErrorCode.INVALID_DATA);
  }

  const cinemas = await CinemaService.getByCity(Number(cityId));
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, cinemas));
});

// GET /api/cinemas/:id — Chi tiết cụm rạp (kèm phòng chiếu)
export const getCinemaById = asyncHandler(async (req: Request, res: Response) => {
  const cinema = await CinemaService.getById(Number(req.params.id));
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, cinema));
});

// POST /api/admin/cinemas — Thêm cụm rạp (Admin)
export const createCinema = asyncHandler(async (req: Request, res: Response) => {
  const cinema = await CinemaService.create(req.body);
  return res.status(201).json(ApiResponse.success(ResponseCode.USER_CREATED, cinema));
});

// PUT /api/admin/cinemas/:id — Sửa thông tin cụm rạp (Admin)
export const updateCinema = asyncHandler(async (req: Request, res: Response) => {
  const cinema = await CinemaService.update(Number(req.params.id), req.body);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, cinema));
});

// DELETE /api/admin/cinemas/:id — Xóa rạp (Admin, soft delete)
export const deleteCinema = asyncHandler(async (req: Request, res: Response) => {
  await CinemaService.delete(Number(req.params.id));
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, null));
});
