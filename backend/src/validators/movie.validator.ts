import Joi from('joi');

// Schema cho tạo/cập nhật phim
const movieSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.empty': 'Tên phim không được để trống',
    'string.min': 'Tên phim phải có ít nhất 1 ký tự',
    'string.max': 'Tên phim tối đa 200 ký tự',
    'any.required': 'Tên phim là bắt buộc'
  }),
  genre: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Thể loại không được để trống',
    'any.required': 'Thể loại là bắt buộc'
  }),
  language: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Ngôn ngữ không được để trống',
    'any.required': 'Ngôn ngữ là bắt buộc'
  }),
  runtime: Joi.number().integer().min(1).required().messages({
    'number.base': 'Thời lượng phải là số',
    'number.min': 'Thời lượng phải lớn hơn 0',
    'any.required': 'Thời lượng là bắt buộc'
  }),
  releaseDate: Joi.date().optional(),
  actor: Joi.string().max(500).optional(),
  director: Joi.string().max(200).optional(),
  description: Joi.string().max(2000).optional(),
  trailerUrl: Joi.string().uri().max(500).optional(),
  rating: Joi.number().min(0).max(10).precision(1).optional().messages({
    'number.min': 'Rating phải từ 0-10',
    'number.max': 'Rating phải từ 0-10'
  }),
  isFeatured: Joi.boolean().optional(),
  featuredOrder: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional()
});

// Middleware validate cho tạo phim
const validateCreateMovie = (req: any, res: any, next: any) => {
  const { error } = movieSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const messages = error.details.map((detail: any) => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }
  
  next();
};

// Middleware validate cho cập nhật phim (tất cả trường optional)
const validateUpdateMovie = (req: any, res: any, next: any) => {
  const updateSchema = movieSchema.fork(
    ['title', 'genre', 'language', 'runtime'],
    (schema) => schema.optional()
  ).and('title', 'genre', 'language', 'runtime'); // Bỏ required khi update
  
  const { error } = updateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const messages = error.details.map((detail: any) => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }
  
  next();
};

// Schema cho tìm kiếm phim
const searchSchema = Joi.object({
  q: Joi.string().min(1).required().messages({
    'string.empty': 'Từ khóa tìm kiếm không được để trống',
    'any.required': 'Từ khóa tìm kiếm là bắt buộc'
  })
});

const validateSearch = (req: any, res: any, next: any) => {
  const { error } = searchSchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    const messages = error.details.map((detail: any) => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Tham số tìm kiếm không hợp lệ',
      errors: messages
    });
  }
  
  next();
};

module.exports = {
  validateCreateMovie,
  validateUpdateMovie,
  validateSearch
};
