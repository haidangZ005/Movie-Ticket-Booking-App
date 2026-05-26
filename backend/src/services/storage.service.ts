import path from 'path';
import { Client } from 'minio';

const bucket = process.env.MINIO_BUCKET || 'movie-assets';
const publicUrl = (process.env.MINIO_PUBLIC_URL || `http://localhost:9000/${bucket}`).replace(/\/+$/, '');

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
});

const buildObjectName = (file: Express.Multer.File, folder: string): string => {
  const ext = path.extname(file.originalname).toLowerCase();
  const safeBaseName = path
    .basename(file.originalname, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);

  return `${folder}/${Date.now()}-${safeBaseName || 'file'}${ext}`;
};

export class StorageService {
  static async uploadFile(file: Express.Multer.File, folder: 'movies' | 'products' | 'trailers'): Promise<string> {
    const objectName = buildObjectName(file, folder);

    await minioClient.putObject(
      bucket,
      objectName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    return `${publicUrl}/${objectName}`;
  }
}
