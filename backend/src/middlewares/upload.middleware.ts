import fs from 'fs';
import path from 'path';
import multer from 'multer';

const movieUploadDir = path.join(process.cwd(), 'public', 'uploads', 'movies');

fs.mkdirSync(movieUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, movieUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);

    cb(null, `${Date.now()}-${safeBaseName || 'movie'}${ext}`);
  },
});

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
    return;
  }

  cb(new Error('Chỉ cho phép tải lên file ảnh'));
};

export const uploadMoviePoster = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// === Quản lý Upload Ảnh Sản Phẩm ===
const productUploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
fs.mkdirSync(productUploadDir, { recursive: true });

const productStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, productUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);

    cb(null, `${Date.now()}-product${ext}`);
  },
});

export const uploadProductImage = multer({
  storage: productStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
