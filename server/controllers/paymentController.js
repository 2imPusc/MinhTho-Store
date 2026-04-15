const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate } = require('../utils/paginate');

const paymentController = {
    createPayment: asyncHandler(async (req, res) => {
        const { clientId, customerId, orderId, amount, method, note } = req.body;

        if (clientId) {
            const existing = await Payment.findOne({ clientId });
            if (existing) {
                return res.status(200).json({ message: 'Thanh toán đã tồn tại (dedup)', payment: existing });
            }
        }

        if (!customerId) throw new AppError('Khách hàng là bắt buộc', 400);
        if (!amount || amount <= 0) throw new AppError('Số tiền phải lớn hơn 0', 400);

        const customer = await Customer.findById(customerId);
        if (!customer) throw new AppError('Không tìm thấy khách hàng', 404);

        if (orderId) {
            const order = await Order.findById(orderId);
            if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
            if (String(order.customer) !== customerId) {
                throw new AppError('Đơn hàng không thuộc khách hàng này', 400);
            }

            const remaining = order.totalAmount - order.paidAmount;
            if (amount > remaining) {
                throw new AppError(`Số tiền vượt quá còn nợ của đơn hàng (${remaining.toLocaleString()}đ)`, 400);
            }

            order.paidAmount += amount;
            order.paymentHistory.push({
                amount,
                method: method || 'Tien mat',
                note: note || 'Thanh toán theo hóa đơn'
            });
            await order.save();
        }

        const payment = new Payment({
            clientId: clientId || undefined,
            customer: customerId,
            order: orderId || null,
            amount,
            method: method || 'Tien mat',
            note,
            createdBy: req.user.id
        });

        await payment.save();
        res.status(201).json({ message: 'Ghi nhận thanh toán thành công', payment });
    }),

    getAllPayments: asyncHandler(async (req, res) => {
        const { page, limit, from, to, customerId, method } = req.query;
        const filter = {};
        if (customerId) filter.customer = customerId;
        if (method) filter.method = method;
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
            const result = await paginate(Payment, {
                filter,
                page, limit,
                populate: [
                    { path: 'customer', select: 'name phone type' },
                    { path: 'order', select: 'totalAmount createdAt' }
                ]
            });
            return res.status(200).json(result);
        }
        const payments = await Payment.find(filter)
            .populate('customer', 'name phone type')
            .populate('order', 'totalAmount createdAt')
            .sort({ createdAt: -1 });
        res.status(200).json(payments);
    }),

    getPaymentsByCustomer: asyncHandler(async (req, res) => {
        const payments = await Payment.find({ customer: req.params.customerId })
            .populate('order', 'totalAmount createdAt')
            .sort({ createdAt: -1 });
        res.status(200).json(payments);
    }),

    getCustomerDebt: asyncHandler(async (req, res) => {
        const customerId = req.params.customerId;
        const customer = await Customer.findById(customerId);
        if (!customer) throw new AppError('Không tìm thấy khách hàng', 404);

        const orders = await Order.find({ customer: customerId })
            .populate('items.product', 'name code unit')
            .sort({ createdAt: -1 });

        const totalOrdered = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalPaidOnOrders = orders.reduce((sum, o) => sum + o.paidAmount, 0);

        const generalPayments = await Payment.find({
            customer: customerId,
            order: null
        }).sort({ createdAt: -1 });

        const totalGeneralPaid = generalPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPaid = totalPaidOnOrders + totalGeneralPaid;
        const totalDebt = totalOrdered - totalPaid;

        res.status(200).json({
            customer,
            totalOrdered,
            totalPaid,
            totalDebt,
            orders,
            generalPayments
        });
    }),

    // Single aggregate pass — tránh O(n²)
    getAllDebts: asyncHandler(async (req, res) => {
        const orderAgg = await Order.aggregate([
            { $match: { customer: { $ne: null } } },
            {
                $group: {
                    _id: '$customer',
                    totalOrdered: { $sum: '$totalAmount' },
                    totalPaidOnOrders: { $sum: '$paidAmount' },
                    orderCount: { $sum: 1 },
                },
            },
        ]);

        if (orderAgg.length === 0) return res.status(200).json([]);

        const customerIds = orderAgg.map((o) => o._id);

        const [generalAgg, customers] = await Promise.all([
            Payment.aggregate([
                { $match: { customer: { $in: customerIds }, order: null } },
                { $group: { _id: '$customer', totalGeneralPaid: { $sum: '$amount' } } },
            ]),
            Customer.find({ _id: { $in: customerIds } }),
        ]);

        const generalMap = new Map(generalAgg.map((g) => [String(g._id), g.totalGeneralPaid]));
        const customerMap = new Map(customers.map((c) => [String(c._id), c]));

        const debts = orderAgg
            .map((o) => {
                const customer = customerMap.get(String(o._id));
                if (!customer) return null;
                const totalGeneralPaid = generalMap.get(String(o._id)) || 0;
                const totalPaid = o.totalPaidOnOrders + totalGeneralPaid;
                return {
                    customer,
                    totalOrdered: o.totalOrdered,
                    totalPaid,
                    totalDebt: o.totalOrdered - totalPaid,
                    orderCount: o.orderCount,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.totalDebt - a.totalDebt);

        res.status(200).json(debts);
    }),

    deletePayment: asyncHandler(async (req, res) => {
        const payment = await Payment.findById(req.params.id);
        if (!payment) throw new AppError('Không tìm thấy thanh toán', 404);

        if (payment.order) {
            const order = await Order.findById(payment.order);
            if (order) {
                order.paidAmount = Math.max(0, order.paidAmount - payment.amount);
                await order.save();
            }
        }

        await Payment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Xóa thanh toán thành công' });
    })
};

module.exports = paymentController;
