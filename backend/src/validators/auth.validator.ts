import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppException } from '../utils/exceptions/app.exception';
import { ErrorCode } from '../utils/exceptions/error.code';

export const authValidator = {
  validateRegister: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  },

  validateLogin: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  },

  validateVerifyOtp: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  },

  validateRefreshToken: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      refreshToken: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  },

  validateLogout: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      refreshToken: Joi.string().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  },

  validateForgotPassword: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  },

  validateVerifyResetOtp: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  },

  validateResetPassword: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      newPassword: Joi.string().min(8).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  },

  validateChangePassword: (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
      refreshToken: Joi.string().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return next(new AppException({ ...ErrorCode.INVALID_DATA, message: error.details[0].message }));
    }
    next();
  }
};
