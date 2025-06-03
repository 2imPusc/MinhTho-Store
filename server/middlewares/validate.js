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

const validateProduct = (req, res, next) => {
    const supplierInfoSchema = Joi.object({
        name: Joi.string().min(3).max(100).required().messages({
            'string.empty': 'Tên nhà cung cấp không được để trống',
            'string.min': 'Tên nhà cung cấp phải có ít nhất 3 ký tự',
            'string.max': 'Tên nhà cung cấp không được vượt quá 100 ký tự',
            'any.required': 'Tên nhà cung cấp là bắt buộc'
        }),
        phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
            'string.pattern.base': 'Số điện thoại nhà cung cấp phải có đúng 10 chữ số'
        }),
        paymentInfo: Joi.string().optional().allow('').messages({
            'string.empty': 'Thông tin thanh toán có thể để trống'
        }),
        address: Joi.string().optional().allow('').messages({
            'string.empty': 'Địa chỉ có thể để trống'
        }),
        note: Joi.string().optional().allow('').messages({
            'string.empty': 'Ghi chú có thể để trống'
        })
    });

    const schema = Joi.object({
        code: Joi.string().min(3).max(50).required().messages({
            'string.empty': 'Mã sản phẩm không được để trống',
            'string.min': 'Mã sản phẩm phải có ít nhất 3 ký tự',
            'string.max': 'Mã sản phẩm không được vượt quá 50 ký tự',
            'any.required': 'Mã sản phẩm là bắt buộc'
        }),
        name: Joi.string().min(3).max(100).required().messages({
            'string.empty': 'Tên sản phẩm không được để trống',
            'string.min': 'Tên sản phẩm phải có ít nhất 3 ký tự',
            'string.max': 'Tên sản phẩm không được vượt quá 100 ký tự',
            'any.required': 'Tên sản phẩm là bắt buộc'
        }),
        price: Joi.number().min(0).required().messages({
            'number.base': 'Giá phải là một số',
            'number.min': 'Giá không được âm',
            'any.required': 'Giá là bắt buộc'
        }),
        importPrice: Joi.number().min(0).required().messages({
            'number.base': 'Giá nhập phải là một số',
            'number.min': 'Giá nhập không được âm',
            'any.required': 'Giá nhập là bắt buộc'
        }),
        unit: Joi.string().optional().allow('').messages({
            'string.empty': 'Đơn vị có thể để trống'
        }),
        imageUrl: Joi.string().uri().optional().allow('').messages({
            'string.uri': 'URL hình ảnh không hợp lệ',
            'string.empty': 'URL hình ảnh có thể để trống'
        }),
        location: Joi.string().optional().allow('').messages({
            'string.empty': 'Vị trí có thể để trống'
        }),
        category: Joi.string().optional().allow('').messages({
            'string.empty': 'Danh mục có thể để trống'
        }),
        description: Joi.string().optional().allow('').messages({
            'string.empty': 'Mô tả có thể để trống'
        }),
        supplierId: Joi.string().hex().length(24).optional().messages({
            'string.hex': 'ID nhà cung cấp không hợp lệ',
            'string.length': 'ID nhà cung cấp phải có đúng 24 ký tự'
        }),
        supplierInfo: supplierInfoSchema.optional().messages({
            'object.base': 'Thông tin nhà cung cấp phải là một object'
        })
    }).oxor('supplierId', 'supplierInfo').messages({
        'object.oxor': 'Chỉ được cung cấp một trong hai: supplierId hoặc supplierInfo'
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
};

const validateSupplierCreate = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).required().messages({
            'string.empty': 'Tên nhà cung cấp không được để trống',
            'string.min': 'Tên nhà cung cấp phải có ít nhất 3 ký tự',
            'string.max': 'Tên nhà cung cấp không được vượt quá 100 ký tự',
            'any.required': 'Tên nhà cung cấp là bắt buộc'
        }),
        phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
            'string.pattern.base': 'Số điện thoại nhà cung cấp phải có đúng 10 chữ số'
        }),
        paymentInfo: Joi.string().optional().allow('').messages({
            'string.empty': 'Thông tin thanh toán có thể để trống'
        }),
        address: Joi.string().optional().allow('').messages({
            'string.empty': 'Địa chỉ có thể để trống'
        }),
        note: Joi.string().optional().allow('').messages({
            'string.empty': 'Ghi chú có thể để trống'
        })
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
};

const validateSupplierUpdate = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(100).optional().messages({
            'string.min': 'Tên nhà cung cấp phải có ít nhất 3 ký tự',
            'string.max': 'Tên nhà cung cấp không được vượt quá 100 ký tự'
        }),
        phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
            'string.pattern.base': 'Số điện thoại nhà cung cấp phải có đúng 10 chữ số'
        }),
        paymentInfo: Joi.string().optional().allow(''),
        address: Joi.string().optional().allow(''),
        note: Joi.string().optional().allow('')
    }).min(1).messages({
        'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
};

const itemSchema = Joi.object({
    product: Joi.string().hex().length(24).required().messages({
        'string.base': 'ID sản phẩm phải là chuỗi',
        'string.hex': 'ID sản phẩm không hợp lệ',
        'string.length': 'ID sản phẩm phải có 24 ký tự',
        'any.required': 'ID sản phẩm là bắt buộc'
    }),
    quantity: Joi.number().integer().min(1).required().messages({
        'number.base': 'Số lượng phải là số',
        'number.min': 'Số lượng phải lớn hơn 0',
        'any.required': 'Số lượng là bắt buộc'
    })
});

const validateOrderCreate = (req, res, next) => {
    const schema = Joi.object({
        user: Joi.alternatives().try(
            Joi.string().hex().length(24),
            Joi.object({
                name: Joi.string().min(2).max(50).required(),
                phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
                password: Joi.string().min(6),
                location: Joi.string().allow('')
            })
        ).required(),
        items: Joi.array().items(itemSchema).min(1).required(),
        paidAmount: Joi.number().min(0).default(0),
        paymentMethod: Joi.string().allow(''),
        paymentNote: Joi.string().allow('')
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
};

const validateOrderUpdate = (req, res, next) => {
    const schema = Joi.object({
        items: Joi.array().items(itemSchema).min(1),
        paidAmount: Joi.number().min(0),
        paymentMethod: Joi.string().allow(''),
        paymentNote: Joi.string().allow(''),
        amount: Joi.number().min(0), // cho cập nhật thanh toán
        method: Joi.string().allow(''),
        note: Joi.string().allow('')
    }).min(1).messages({
        'object.min': 'Phải cung cấp ít nhất một trường để cập nhật'
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return res.status(400).json({ message: 'Validation error', errors });
    }
    next();
};

module.exports = {
    validateRegister, validateLogin, validateToken,
    validateSupplierCreate, validateSupplierUpdate,
    validateProduct,
    validateOrderCreate, validateOrderUpdate
};