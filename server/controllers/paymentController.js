const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Customer = require('../models/Customer');

const paymentController = {
    // Create payment - per order or per customer (general debt)
    createPayment: async (req, res) => {
        try {
            const { customerId, orderId, amount, method, note } = req.body;

            if (!customerId) {
                return res.status(400).json({ message: 'Khach hang la bat buoc' });
            }
            if (!amount || amount <= 0) {
                return res.status(400).json({ message: 'So tien phai lon hon 0' });
            }

            const customer = await Customer.findById(customerId);
            if (!customer) return res.status(404).json({ message: 'Khong tim thay khach hang' });

            // If payment is for a specific order
            if (orderId) {
                const order = await Order.findById(orderId);
                if (!order) return res.status(404).json({ message: 'Khong tim thay don hang' });
                if (String(order.customer) !== customerId) {
                    return res.status(400).json({ message: 'Don hang khong thuoc khach hang nay' });
                }

                const remaining = order.totalAmount - order.paidAmount;
                if (amount > remaining) {
                    return res.status(400).json({ message: `So tien vuot qua con no cua don hang (${remaining.toLocaleString()}d)` });
                }

                // Update order paidAmount
                order.paidAmount += amount;
                order.paymentHistory.push({
                    amount,
                    method: method || 'Tien mat',
                    note: note || 'Thanh toan theo hoa don'
                });
                await order.save();
            }

            const payment = new Payment({
                customer: customerId,
                order: orderId || null,
                amount,
                method: method || 'Tien mat',
                note,
                createdBy: req.user.id
            });

            await payment.save();
            res.status(201).json({ message: 'Ghi nhan thanh toan thanh cong', payment });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get all payments for a customer
    getPaymentsByCustomer: async (req, res) => {
        try {
            const payments = await Payment.find({ customer: req.params.customerId })
                .populate('order', 'totalAmount createdAt')
                .sort({ createdAt: -1 });
            res.status(200).json(payments);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get customer debt summary
    getCustomerDebt: async (req, res) => {
        try {
            const customerId = req.params.customerId;
            const customer = await Customer.findById(customerId);
            if (!customer) return res.status(404).json({ message: 'Khong tim thay khach hang' });

            // Total from orders
            const orders = await Order.find({ customer: customerId })
                .populate('items.product', 'name code unit')
                .sort({ createdAt: -1 });

            const totalOrdered = orders.reduce((sum, o) => sum + o.totalAmount, 0);
            const totalPaidOnOrders = orders.reduce((sum, o) => sum + o.paidAmount, 0);

            // General payments (not tied to specific order)
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
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get all customers with debt summary (for dashboard)
    getAllDebts: async (req, res) => {
        try {
            const customers = await Customer.find();
            const debts = [];

            for (const customer of customers) {
                const orders = await Order.find({ customer: customer._id });
                const totalOrdered = orders.reduce((sum, o) => sum + o.totalAmount, 0);
                const totalPaidOnOrders = orders.reduce((sum, o) => sum + o.paidAmount, 0);

                const generalPayments = await Payment.find({
                    customer: customer._id,
                    order: null
                });
                const totalGeneralPaid = generalPayments.reduce((sum, p) => sum + p.amount, 0);

                const totalPaid = totalPaidOnOrders + totalGeneralPaid;
                const totalDebt = totalOrdered - totalPaid;

                if (totalOrdered > 0) {
                    debts.push({
                        customer,
                        totalOrdered,
                        totalPaid,
                        totalDebt,
                        orderCount: orders.length
                    });
                }
            }

            // Sort by debt descending
            debts.sort((a, b) => b.totalDebt - a.totalDebt);
            res.status(200).json(debts);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete payment
    deletePayment: async (req, res) => {
        try {
            const payment = await Payment.findById(req.params.id);
            if (!payment) return res.status(404).json({ message: 'Khong tim thay thanh toan' });

            // If payment was tied to an order, reverse it
            if (payment.order) {
                const order = await Order.findById(payment.order);
                if (order) {
                    order.paidAmount = Math.max(0, order.paidAmount - payment.amount);
                    await order.save();
                }
            }

            await Payment.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Xoa thanh toan thanh cong' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = paymentController;
