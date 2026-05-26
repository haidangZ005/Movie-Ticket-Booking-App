import { Request, Response } from 'express';
import { ProductModel } from '../../models/product.model';
import { asyncHandler } from '../../utils/helpers/async.handler';
import { AppException } from '../../utils/exceptions/app.exception';
import { ErrorCode } from '../../utils/exceptions/error.code';
import { ApiResponse } from '../../utils/dto/api.response';
import { ResponseCode } from '../../utils/constants/response.code';
import { StorageService } from '../../services/storage.service';

// GET /api/admin/products
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await ProductModel.getAll();
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, products));
});

// POST /api/admin/uploads/product-image
export const uploadProductImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppException({ ...ErrorCode.INVALID_DATA, message: 'Không có file nào được tải lên' });
  const imageUrl = await StorageService.uploadFile(req.file, 'products');
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, { imageUrl }));
});

// GET /api/products (Public)
export const getPublicProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await ProductModel.getAll();
  const activeProducts = products.filter(p => p.IsActive);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, activeProducts));
});


// GET /api/admin/products/:id
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const product = await ProductModel.getById(id);
  if (!product) throw new AppException(ErrorCode.DATA_NOT_FOUND);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, product));
});

// POST /api/admin/products
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductModel.create(req.body);
  return res.status(201).json(ApiResponse.success(ResponseCode.SUCCESS, product));
});

// PUT /api/admin/products/:id
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = await ProductModel.getById(id);
  if (!existing) throw new AppException(ErrorCode.DATA_NOT_FOUND);

  const product = await ProductModel.update(id, req.body);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, product));
});

// DELETE /api/admin/products/:id
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = await ProductModel.getById(id);
  if (!existing) throw new AppException(ErrorCode.DATA_NOT_FOUND);

  await ProductModel.delete(id);
  return res.status(200).json(ApiResponse.success(ResponseCode.SUCCESS, null));
});
