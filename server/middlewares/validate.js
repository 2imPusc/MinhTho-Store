const Joi = require('joi');

// Validation schema cho register
const validateRegister = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required().messages({
            'string.empty': 'Tên không được để trống',
            'string.min': 'Tên phải có ít nhất 2 ký tự',
            'string.max': 'Tên không được vượt quá 50 ký tự',
            'any.required': 'Tên là bắt buộc'
        }),
        phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
            'string.pattern.base': 'Số điện thoại phải có đúng 10 chữ số',
            'any.required': 'Số điện thoại là bắt buộc'
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu là bắt buộc'
        }),
        location: Joi.string().optional().allow('').messages({
            'string.empty': 'Địa điểm có thể để trống'
        })
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
};

// Validation schema cho login
const validateLogin = (req, res, next) => {
    const schema = Joi.object({
        phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
            'string.pattern.base': 'Số điện thoại phải có đúng 10 chữ số',
            'any.required': 'Số điện thoại là bắt buộc'
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu là bắt buộc'
        })
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
};

// Validation schema cho refreshToken và logout
const validateToken = (req, res, next) => {
    const schema = Joi.object({
        refreshToken: Joi.string().required().messages({
            'string.empty': 'Refresh token không được để trống',
            'any.required': 'Refresh token là bắt buộc'
        })
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateToken
};