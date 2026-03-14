const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const orderController = {
    // Create a new order
    createOrder: async (req, res) => {
        try {
            const { customerId, items, paidAmount = 0, paymentMethod = '', paymentNote = '', note = '' } = req.body;

            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'Don hang phai co it nhat 1 san pham' });
            }

            // Validate customer
            let customer = null;
            if (customerId) {
                customer = await Customer.findById(customerId);
                if (!customer) return res.status(404).json({ message: 'Khong tim thay khach hang' });
            }

            // Calculate total and snapshot prices
            let totalAmount = 0;
            const orderItems = [];
            for (const item of items) {
                const product = await Product.findById(item.product);
                if (!product) return res.status(404).json({ message: `Khong tim thay san pham voi ID ${item.product}` });
                const itemPrice = product.price;
                totalAmount += itemPrice * item.quantity;
                orderItems.push({
                    product: product._id,
                    quantity: item.quantity,
                    price: itemPrice
                });
            }

            if (paidAmount > totalAmount) {
                return res.status(400).json({ message: 'So tien da tra khong duoc vuot qua tong tien don hang' });
            }

            const paymentHistory = [];
            if (paidAmount > 0) {
                paymentHistory.push({
                    amount: paidAmount,
                    method: paymentMethod || 'Tien mat',
                    note: paymentNote || 'Thanh toan khi tao don'
                });
            }

            const newOrder = new Order({
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

            res.status(201).json({ message: 'Tao don hang thanh cong', order: populated });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get all orders
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.find()
                .populate('customer', 'name phone type')
                .populate('items.product', 'name price unit code')
                .sort({ createdAt: -1 })
                .select('-__v');
            res.status(200).json(orders);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id)
                .populate('customer', 'name phone type address')
                .populate('items.product', 'name price unit code')
                .select('-__v');

            if (!order) {
                return res.status(404).json({ message: 'Khong tim thay don hang' });
            }

            res.status(200).json(order);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get orders by customer
    getOrdersByCustomer: async (req, res) => {
        try {
            const orders = await Order.find({ customer: req.params.customerId })
                .populate('customer', 'name phone type')
                .populate('items.product', 'name price unit code')
                .sort({ createdAt: -1 })
                .select('-__v');
            res.status(200).json(orders);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Add payment to order
    addPayment: async (req, res) => {
        try {
            const { amount, method, note } = req.body;
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Khong tim thay don hang' });
            }

            if (order.paidAmount >= order.totalAmount) {
                return res.status(400).json({ message: 'Don hang da duoc thanh toan day du' });
            }

            if (!amount || amount <= 0) {
                return res.status(400).json({ message: 'So tien thanh toan phai lon hon 0' });
            }

            if (order.paidAmount + amount > order.totalAmount) {
                return res.status(400).json({ message: 'So tien thanh toan khong duoc vuot qua tong tien don hang' });
            }

            order.paidAmount += amount;
            order.paymentHistory.push({
                amount,
                method: method || 'Tien mat',
                note: note || 'Cap nhat thanh toan'
            });

            await order.save();
            res.status(200).json({ message: 'Cap nhat thanh toan thanh cong', order });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Mark order as fully paid
    markPaidOrder: async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Khong tim thay don hang' });
            }

            if (order.paidAmount >= order.totalAmount) {
                return res.status(400).json({ message: 'Don hang da duoc thanh toan day du' });
            }

            const remaining = order.totalAmount - order.paidAmount;
            order.paidAmount = order.totalAmount;
            order.paymentHistory.push({
                amount: remaining,
                method: 'Tien mat',
                note: 'Thanh toan day du'
            });

            await order.save();
            res.status(200).json({ message: 'Don hang da duoc danh dau la da thanh toan', order });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Delete order
    deleteOrder: async (req, res) => {
        try {
            const order = await Order.findByIdAndDelete(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Khong tim thay don hang' });
            }
            res.status(200).json({ message: 'Xoa don hang thanh cong' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = orderController;
