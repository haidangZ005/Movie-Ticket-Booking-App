import multer from 'multer';

const storage = multer.memoryStorage();

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
    return;
  }

  cb(new Error('Chi cho phep tai len file anh'));
};

const videoFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
    return;
  }

  cb(new Error('Chi cho phep tai len file video'));
};

export const uploadMoviePoster = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadProductImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadMovieTrailer = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
});
