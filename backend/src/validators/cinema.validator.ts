import Joi from('joi');

// Schema cho tạo/cập nhật cụm rạp
const cinemaSchema = Joi.object({
  cinemaName: Joi.string().min(1).max(200).required().messages({
    'string.empty': 'Tên cụm rạp không được để trống',
    'any.required': 'Tên cụm rạp là bắt buộc'
  }),
  address: Joi.string().max(500).optional(),
  district: Joi.string().max(100).optional(),
  cityId: Joi.number().integer().min(1).required().messages({
    'number.base': 'Mã thành phố phải là số',
    'any.required': 'Thành phố là bắt buộc'
  }),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  isActive: Joi.boolean().optional()
});

// Middleware validate cho tạo cụm rạp
const validateCreateCinema = (req: any, res: any, next: any) => {
  const { error } = cinemaSchema.validate(req.body, { abortEarly: false });
  
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

// Middleware validate cho cập nhật cụm rạp
const validateUpdateCinema = (req: any, res: any, next: any) => {
  const updateSchema = cinemaSchema.fork(
    ['cinemaName', 'cityId'],
    (schema) => schema.optional()
  );
  
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

module.exports = {
  validateCreateCinema,
  validateUpdateCinema
};
