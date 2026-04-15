const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Không tìm thấy route ${req.originalUrl}`,
    });
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi máy chủ';

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Giá trị không hợp lệ cho trường ${err.path}`;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'trường';
        message = `Giá trị trùng lặp: ${field}`;
    }

    // Mongoose validation
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((e) => e.message).join(', ');
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token không hợp lệ';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token đã hết hạn';
    }

    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        console.error('[ERROR]', err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

module.exports = { notFound, errorHandler };
