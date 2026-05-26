const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const sql = require('mssql');
const { Client } = require('minio');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const manifestPath = path.join(repoRoot, 'database', 'seeds', 'media-manifest.json');
const assetsRoot = path.join(repoRoot, 'database', 'assets');

const requiredEnv = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET',
  'MINIO_PUBLIC_URL',
];

function assertEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env values: ${missing.join(', ')}`);
  }
}

function getContentType(objectPath) {
  const ext = path.extname(objectPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.mkv') return 'video/x-matroska';
  return 'application/octet-stream';
}

function publicUrlFor(objectPath) {
  return `${process.env.MINIO_PUBLIC_URL.replace(/\/$/, '')}/${objectPath.replace(/\\/g, '/')}`;
}

function createMinioClient() {
  return new Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: String(process.env.MINIO_USE_SSL || 'false').toLowerCase() === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
}

function createDbConfig() {
  const config = {
    server: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'appDatvexemPhim',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
    },
  };

  if (!process.env.DB_INSTANCE) {
    config.port = Number(process.env.DB_PORT || 1433);
  }

  return config;
}

async function ensureBucket(client, bucket) {
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket);
    console.log(`[MinIO] Created bucket: ${bucket}`);
  }
}

async function uploadAsset(client, bucket, objectPath) {
  if (!objectPath) return null;

  const filePath = path.join(assetsRoot, objectPath.replace(/\//g, path.sep));
  if (!fs.existsSync(filePath)) {
    throw new Error(`Asset file not found: ${filePath}`);
  }

  await client.fPutObject(bucket, objectPath, filePath, {
    'Content-Type': getContentType(objectPath),
  });

  return publicUrlFor(objectPath);
}

async function updateMovie(pool, movie) {
  const posterUrl = publicUrlFor(movie.PosterObject);
  const trailerUrl = publicUrlFor(movie.TrailerObject);

  await pool.request()
    .input('MovieID', sql.Int, movie.MovieID)
    .input('MovieTitle', sql.NVarChar(255), movie.MovieTitle)
    .input('MovieGenre', sql.NVarChar(255), movie.MovieGenre)
    .input('MovieLanguage', sql.NVarChar(100), movie.MovieLanguage)
    .input('MovieRuntime', sql.Int, movie.MovieRuntime)
    .input('MovieReleaseDate', sql.Date, movie.MovieReleaseDate ? new Date(movie.MovieReleaseDate) : null)
    .input('MovieActor', sql.NVarChar(sql.MAX), movie.MovieActor)
    .input('MovieDirector', sql.NVarChar(255), movie.MovieDirector)
    .input('MovieDescription', sql.NVarChar(sql.MAX), movie.MovieDescription)
    .input('PosterUrl', sql.NVarChar(500), posterUrl)
    .input('TrailerUrl', sql.NVarChar(500), trailerUrl)
    .input('Rating', sql.Decimal(3, 1), movie.Rating)
    .input('IsFeatured', sql.Bit, Boolean(movie.IsFeatured))
    .input('FeaturedOrder', sql.Int, movie.FeaturedOrder || 0)
    .input('IsActive', sql.Bit, Boolean(movie.IsActive))
    .query(`
      UPDATE Movie
      SET MovieTitle = @MovieTitle,
          MovieGenre = @MovieGenre,
          MovieLanguage = @MovieLanguage,
          MovieRuntime = @MovieRuntime,
          MovieReleaseDate = @MovieReleaseDate,
          MovieActor = @MovieActor,
          MovieDirector = @MovieDirector,
          MovieDescription = @MovieDescription,
          PosterUrl = @PosterUrl,
          TrailerUrl = @TrailerUrl,
          Rating = @Rating,
          IsFeatured = @IsFeatured,
          FeaturedOrder = @FeaturedOrder,
          IsActive = @IsActive
      WHERE MovieID = @MovieID
    `);
}

async function updateProduct(pool, product) {
  const imageUrl = publicUrlFor(product.ImageObject);

  await pool.request()
    .input('ProductID', sql.Int, product.ProductID)
    .input('ProductName', sql.NVarChar(255), product.ProductName)
    .input('ProductDescription', sql.NVarChar(sql.MAX), product.ProductDescription)
    .input('ProductPrice', sql.Decimal(10, 2), product.ProductPrice)
    .input('ImageProduct', sql.NVarChar(500), imageUrl)
    .input('IsActive', sql.Bit, Boolean(product.IsActive))
    .input('ProductCategory', sql.NVarChar(50), product.ProductCategory || 'OTHER')
    .query(`
      UPDATE Product
      SET ProductName = @ProductName,
          ProductDescription = @ProductDescription,
          ProductPrice = @ProductPrice,
          ImageProduct = @ImageProduct,
          IsActive = @IsActive,
          ProductCategory = @ProductCategory
      WHERE ProductID = @ProductID
    `);
}

async function main() {
  assertEnv();

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const bucket = process.env.MINIO_BUCKET;
  const minio = createMinioClient();

  console.log(`[Seed] Using manifest: ${manifestPath}`);
  console.log(`[Seed] Using assets: ${assetsRoot}`);
  console.log(`[Seed] MinIO bucket: ${bucket}`);
  console.log(`[Seed] Public URL: ${process.env.MINIO_PUBLIC_URL}`);

  await ensureBucket(minio, bucket);

  for (const movie of manifest.movies || []) {
    await uploadAsset(minio, bucket, movie.PosterObject);
    await uploadAsset(minio, bucket, movie.TrailerObject);
    console.log(`[MinIO] Uploaded movie assets: #${movie.MovieID} ${movie.MovieTitle}`);
  }

  for (const product of manifest.products || []) {
    await uploadAsset(minio, bucket, product.ImageObject);
    console.log(`[MinIO] Uploaded product asset: #${product.ProductID} ${product.ProductName}`);
  }

  const pool = await sql.connect(createDbConfig());

  for (const movie of manifest.movies || []) {
    await updateMovie(pool, movie);
    console.log(`[DB] Updated movie: #${movie.MovieID} ${movie.MovieTitle}`);
  }

  for (const product of manifest.products || []) {
    await updateProduct(pool, product);
    console.log(`[DB] Updated product: #${product.ProductID} ${product.ProductName}`);
  }

  await pool.close();
  console.log('[Seed] Media assets uploaded and database URLs updated.');
}

main().catch((error) => {
  console.error('[Seed] Failed:', error.message);
  process.exit(1);
});
