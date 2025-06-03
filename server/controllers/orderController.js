const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const orderController = {
    // Create a new order
    createOrder: async (req, res) => {
        try {
            const { user, items, paidAmount = 0, paymentMethod = '', paymentNote = '' } = req.body;

            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'Đơn hàng phải có ít nhất 1 sản phẩm' });
            }

            let userId;

            // 👇 Nếu user là object => tạo mới
            if (typeof user === 'object' && user !== null) {
                if (!user.name || !user.phone) {
                    return res.status(400).json({ message: 'Tên và số điện thoại là bắt buộc' });
                }
                const existingUser = await User.findOne({phone: user.phone});
                if (existingUser) {
                    userId = existingUser._id;
                } else {
                    if (!user.password) {
                        user.password = '123456';
                    }
                    const newUser = new User(user);
                    await newUser.save();
                    userId = newUser._id;
                }

            } else {
                const existingUser = await User.findById(user);
                if (!existingUser) {
                    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
                }
                userId = existingUser._id;
            }

            let totalAmount = 0;
            for (const item of items) {
            const product = await Product.findById(item.product);
                if (!product) return res.status(404).json({ message: `Không tìm thấy sản phẩm với ID ${item.product}` });
                totalAmount += product.price * item.quantity;
            }

            if (paidAmount > totalAmount) {
                return res.status(400).json({ message: 'Số tiền đã trả không được vượt quá tổng tiền đơn hàng' });
            }

            const paymentHistory = [];
            if (paidAmount > 0) {
                paymentHistory.push({
                    amount: paidAmount,
                    method: paymentMethod || 'Tiền mặt',
                    note: paymentNote || 'Thanh toán khi tạo đơn'
                });
            }

            const newOrder = new Order({
                User: userId,
                items,
                totalAmount,
                paidAmount,
                paymentHistory
            });

            await newOrder.save();
            res.status(201).json({ message: 'Tạo đơn hàng thành công', order: newOrder });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get all orders
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.find().populate('User', 'name phone location').populate('items.product', 'name price unit').select('-__v');
            res.status(200).json({ orders });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id)
                .populate('User', 'name phone location')
                .populate('items.product', 'name price unit')
                .select('-__v');

            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            res.status(200).json({ order });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getOrderByUser: async (req, res) => {
        try {
            const userId = req.user.id;
            const orders = await Order.find({User: userId})
                .populate('User', 'name phone location')
                .populate('items.product', 'name price unit')
                .select('-__v');

            res.status(200).json({ orders });
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    },

    // Update order
    updateOrder: async (req, res) => {
        try {
            const {amount, method, note } = req.body;
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            if (order.isFullyPaid) {
                return res.status(400).json({ message: 'Đơn hàng đã được thanh toán đầy đủ' });
            }

            if (amount <= 0) {
                return res.status(400).json({ message: 'Số tiền thanh toán phải lớn hơn 0' });
            }

            if (order.paidAmount + amount > order.totalAmount) {
                return res.status(400).json({ message: 'Số tiền thanh toán không được vượt quá tổng tiền đơn hàng' });
            }

            order.paidAmount += amount;
            order.paymentHistory.push({
                amount,
                method: method || 'Tiền mặt',
                note: note || 'Cập nhật thanh toán'
            });

            await order.save();
            res.status(200).json({ message: 'Cập nhật đơn hàng thành công', order });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    //MarkPaidOrder
    markPaidOrder: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }

            if (order.isFullyPaid) {
                return res.status(400).json({ message: 'Đơn hàng đã được thanh toán đầy đủ' });
            }

            order.paidAmount = order.totalAmount;
            order.paymentHistory.push({
                amount: order.totalAmount,
                method: 'Tiền mặt',
                note: 'Thanh toán đầy đủ'
            });

            await order.save();
            res.status(200).json({ message: 'Đơn hàng đã được đánh dấu là đã thanh toán', order });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete order
    deleteOrder: async (req, res) => {
        try {
            const order = await Order.findByIdAndDelete(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            }
            res.status(200).json({ message: 'Xóa đơn hàng thành công' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = orderController;