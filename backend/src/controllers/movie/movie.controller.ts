import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';
import MovieService from '../../services/movie.service';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';

// GET /api/movies — Danh sách phim (phân trang)
export const getMovies = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const filters: any = {};
  if (req.query.genre) filters.genre = req.query.genre;
  if (req.query.language) filters.language = req.query.language;
  if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
  if (req.query.isFeatured !== undefined) filters.isFeatured = req.query.isFeatured === 'true';
  
  const { movies, total } = await MovieService.getAll({ page, limit, filters });
  
  return res.status(200).json(ApiResponse.paginate(ResponseCode.SUCCESS, movies, {
    page,
    limit,
    total
  }));
});

// GET /api/movies/featured — Danh sách phim nổi bật
export const getFeaturedMovies = asyncHandler(async (req: Request, res: Response) => {
  const movies = await MovieService.getFeatured();
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, movies));
});

// GET /api/movies/search?q= — Tìm kiếm phim
export const searchMovies = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    throw new AppException(ErrorCode.INVALID_DATA);
  }
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const { movies, total } = await MovieService.search(query, { page, limit });
  
  return res.status(200).json(ApiResponse.paginate(ResponseCode.SUCCESS, movies, {
    page,
    limit,
    total
  }));
});

// GET /api/movies/:id — Chi tiết phim
export const getMovieById = asyncHandler(async (req: Request, res: Response) => {
  const movie = await MovieService.getById(parseInt(req.params.id));
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, movie));
});

// POST & DELETE /api/movies/:id/like — Thích / Bỏ thích phim
export const likeMovie = asyncHandler(async (req: Request, res: Response) => {
  const movieId = parseInt(req.params.id);
  
  // @ts-ignore - Giả định req.user đã được gán bởi authMiddleware
  const customerId = req.user?.customerId;
  
  if (!customerId) {
    throw new AppException(ErrorCode.UNAUTHORIZED);
  }
  
  const isLiked = await MovieService.toggleLike(movieId, customerId);
  return res.status(200).json(ApiResponse.success(
    ResponseCode.SUCCESS, 
    { isLiked }, 
    isLiked ? 'Đã thích phim' : 'Đã bỏ thích phim'
  ));
});

// POST /api/admin/movies — Thêm phim (Admin)
export const createMovie = asyncHandler(async (req: Request, res: Response) => {
  const movie = await MovieService.create(req.body);
  return res.status(201).json(ApiResponse.success(ResponseCode.USER_CREATED, movie, 'Thêm phim thành công'));
});

// PUT /api/admin/movies/:id — Sửa phim (Admin)
export const updateMovie = asyncHandler(async (req: Request, res: Response) => {
  const movie = await MovieService.update(parseInt(req.params.id), req.body);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, movie, 'Cập nhật phim thành công'));
});

// DELETE /api/admin/movies/:id — Xóa phim (Admin - soft delete)
export const deleteMovie = asyncHandler(async (req: Request, res: Response) => {
  const result = await MovieService.delete(parseInt(req.params.id));
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, result, 'Xóa phim thành công'));
});

// PUT /api/admin/movies/:id/featured — Bật/tắt phim nổi bật (Admin)
export const toggleFeaturedMovie = asyncHandler(async (req: Request, res: Response) => {
  const result = await MovieService.toggleFeatured(parseInt(req.params.id));
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, result, 'Đã thay đổi trạng thái nổi bật'));
});
