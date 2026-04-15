const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate } = require('../utils/paginate');

const orderController = {
    createOrder: asyncHandler(async (req, res) => {
        const { clientId, customerId, items, paidAmount = 0, paymentMethod = '', paymentNote = '', note = '' } = req.body;

        // Idempotent: nếu client gửi lại cùng clientId (replay queue offline) → trả đơn đã tạo
        if (clientId) {
            const existing = await Order.findOne({ clientId })
                .populate('customer', 'name phone type')
                .populate('items.product', 'name price unit code');
            if (existing) {
                return res.status(200).json({ message: 'Đơn đã tồn tại (dedup)', order: existing });
            }
        }

        if (!items || items.length === 0) {
            throw new AppError('Đơn hàng phải có ít nhất 1 sản phẩm', 400);
        }

        let customer = null;
        if (customerId) {
            customer = await Customer.findById(customerId);
            if (!customer) throw new AppError('Không tìm thấy khách hàng', 404);
        }

        let totalAmount = 0;
        const orderItems = [];
        const decremented = [];
        try {
            for (const item of items) {
                const updated = await Product.findOneAndUpdate(
                    { _id: item.product, stockQty: { $gte: item.quantity } },
                    { $inc: { stockQty: -item.quantity } },
                    { new: true }
                );
                if (!updated) {
                    const product = await Product.findById(item.product);
                    if (!product) throw new AppError(`Không tìm thấy sản phẩm với ID ${item.product}`, 404);
                    throw new AppError(`Sản phẩm "${product.name}" không đủ tồn kho (còn ${product.stockQty})`, 400);
                }
                decremented.push({ id: updated._id, qty: item.quantity });
                totalAmount += updated.price * item.quantity;
                orderItems.push({
                    product: updated._id,
                    quantity: item.quantity,
                    price: updated.price
                });
            }
        } catch (err) {
            for (const d of decremented) {
                await Product.findByIdAndUpdate(d.id, { $inc: { stockQty: d.qty } });
            }
            throw err;
        }

        if (paidAmount > totalAmount) {
            throw new AppError('Số tiền đã trả không được vượt quá tổng tiền đơn hàng', 400);
        }

        const paymentHistory = [];
        if (paidAmount > 0) {
            paymentHistory.push({
                amount: paidAmount,
                method: paymentMethod || 'Tien mat',
                note: paymentNote || 'Thanh toán khi tạo đơn'
            });
        }

        const newOrder = new Order({
            clientId: clientId || undefined,
            customer: customer ? customer._id : null,
            items: orderItems,
            totalAmount,
            paidAmount,
            paymentHistory,
            note,
            createdBy: req.user.id
        });

        await newOrder.save();

        const populated = await Order.findById(newOrder._id)
            .populate('customer', 'name phone type')
            .populate('items.product', 'name price unit code');

        res.status(201).json({ message: 'Tạo đơn hàng thành công', order: populated });
    }),

    getAllOrders: asyncHandler(async (req, res) => {
        const { page, limit, status, from, to } = req.query;
        const filter = {};
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toDate;
            }
        }
        if (page !== undefined || limit !== undefined) {
            const result = await paginate(Order, {
                filter,
                page, limit,
                populate: [
                    { path: 'customer', select: 'name phone type' },
                    { path: 'items.product', select: 'name price unit code' }
                ],
                select: '-__v'
            });
            if (status === 'paid') result.data = result.data.filter(o => o.paidAmount >= o.totalAmount);
            else if (status === 'unpaid') result.data = result.data.filter(o => o.paidAmount < o.totalAmount);
            return res.status(200).json(result);
        }
        const orders = await Order.find(filter)
            .populate('customer', 'name phone type')
            .populate('items.product', 'name price unit code')
            .sort({ createdAt: -1 })
            .select('-__v');
        res.status(200).json(orders);
    }),

    getOrderById: asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name phone type address')
            .populate('items.product', 'name price unit code')
            .select('-__v');
        if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
        res.status(200).json(order);
    }),

    getOrdersByCustomer: asyncHandler(async (req, res) => {
        const orders = await Order.find({ customer: req.params.customerId })
            .populate('customer', 'name phone type')
            .populate('items.product', 'name price unit code')
            .sort({ createdAt: -1 })
            .select('-__v');
        res.status(200).json(orders);
    }),

    addPayment: asyncHandler(async (req, res) => {
        const { amount, method, note } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

        if (order.paidAmount >= order.totalAmount) {
            throw new AppError('Đơn hàng đã được thanh toán đầy đủ', 400);
        }
        if (!amount || amount <= 0) {
            throw new AppError('Số tiền thanh toán phải lớn hơn 0', 400);
        }
        if (order.paidAmount + amount > order.totalAmount) {
            throw new AppError('Số tiền thanh toán không được vượt quá tổng tiền đơn hàng', 400);
        }

        order.paidAmount += amount;
        order.paymentHistory.push({
            amount,
            method: method || 'Tien mat',
            note: note || 'Cập nhật thanh toán'
        });

        await order.save();
        res.status(200).json({ message: 'Cập nhật thanh toán thành công', order });
    }),

    markPaidOrder: asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id);
        if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
        if (order.paidAmount >= order.totalAmount) {
            throw new AppError('Đơn hàng đã được thanh toán đầy đủ', 400);
        }

        const remaining = order.totalAmount - order.paidAmount;
        order.paidAmount = order.totalAmount;
        order.paymentHistory.push({
            amount: remaining,
            method: 'Tien mat',
            note: 'Thanh toán đầy đủ'
        });

        await order.save();
        res.status(200).json({ message: 'Đơn hàng đã được đánh dấu là đã thanh toán', order });
    }),

    bulkDelete: asyncHandler(async (req, res) => {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError('Danh sách ID không hợp lệ', 400);
        }
        const orders = await Order.find({ _id: { $in: ids } });
        for (const order of orders) {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, { $inc: { stockQty: item.quantity } });
            }
        }
        const result = await Order.deleteMany({ _id: { $in: ids } });
        res.status(200).json({ message: `Đã xóa ${result.deletedCount} đơn hàng và hoàn trả tồn kho`, deletedCount: result.deletedCount });
    }),

    bulkMarkPaid: asyncHandler(async (req, res) => {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError('Danh sách ID không hợp lệ', 400);
        }
        const orders = await Order.find({ _id: { $in: ids } });
        let updatedCount = 0;
        for (const order of orders) {
            if (order.paidAmount >= order.totalAmount) continue;
            const remaining = order.totalAmount - order.paidAmount;
            order.paidAmount = order.totalAmount;
            order.paymentHistory.push({
                amount: remaining,
                method: 'Tien mat',
                note: 'Thanh toán đầy đủ (bulk)'
            });
            await order.save();
            updatedCount += 1;
        }
        res.status(200).json({ message: `Đã đánh dấu ${updatedCount} đơn đã thanh toán`, updatedCount });
    }),

    deleteOrder: asyncHandler(async (req, res) => {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stockQty: item.quantity } });
        }
        res.status(200).json({ message: 'Xóa đơn hàng thành công, đã hoàn trả tồn kho' });
    })
};

module.exports = orderController;
