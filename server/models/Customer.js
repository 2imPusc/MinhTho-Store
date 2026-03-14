const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    type: { type: String, enum: ['le', 'cong_trinh'], default: 'le' },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
