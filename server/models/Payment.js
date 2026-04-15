const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    clientId: { type: String, index: { unique: true, sparse: true } },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // null = tra cong no chung
    amount: { type: Number, required: true },
    method: { type: String, default: 'Tien mat' },
    note: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
