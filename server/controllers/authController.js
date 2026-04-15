const User = require('../models/User');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const generateRefreshToken = (user) => jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_KEY,
    { expiresIn: '30d' }
);

const generateToken = (user) => jwt.sign(
    { id: user._id, role: user.role, phone: user.phone },
    process.env.JWT_ACCESS_KEY,
    { expiresIn: '1d' }
);

const authController = {
    register: asyncHandler(async (req, res) => {
        const { name, phone, password, location, role } = req.body;
        if (phone) {
            const existingUser = await User.findOne({ phone });
            if (existingUser) throw new AppError('Số điện thoại đã được đăng ký', 400);
        }

        const newUser = new User({ name, phone, password, location, role });
        const token = generateToken(newUser);
        const refreshToken = generateRefreshToken(newUser);
        newUser.refreshToken = refreshToken;
        await newUser.save();

        res.status(201).json({
            user: {
                id: newUser._id,
                name: newUser.name,
                phone: newUser.phone,
                role: newUser.role
            },
            token,
            refreshToken
        });
    }),

    login: asyncHandler(async (req, res) => {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone });
        if (!user) throw new AppError('Số điện thoại hoặc mật khẩu không đúng', 400);

        const isMatch = await user.matchPassword(password);
        if (!isMatch) throw new AppError('Số điện thoại hoặc mật khẩu không đúng', 400);

        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();
        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                phone: user.phone
            },
            token,
            refreshToken
        });
    }),

    refreshToken: asyncHandler(async (req, res) => {
        const token = req.body.refreshToken;
        if (!token) throw new AppError('Refresh token không hợp lệ', 403);

        const user = await User.findOne({ refreshToken: token });
        if (!user) throw new AppError('Refresh token không hợp lệ', 403);

        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.JWT_REFRESH_KEY, (err, d) => {
                if (err) reject(err);
                else resolve(d);
            });
        });

        if (decoded.id !== user._id.toString()) {
            throw new AppError('Refresh token không hợp lệ', 403);
        }

        const newAccessToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            token: newAccessToken,
            refreshToken: newRefreshToken
        });
    }),

    logout: asyncHandler(async (req, res) => {
        const { refreshToken } = req.body;
        const user = await User.findOne({ refreshToken });
        if (!user) throw new AppError('Refresh token không hợp lệ', 403);

        user.refreshToken = null;
        await user.save();
        res.status(200).json({ message: 'Đăng xuất thành công' });
    })
};

module.exports = authController;
