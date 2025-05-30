const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {type: String, required: true},
    phone: {type: String},
    paymentInfo: {type: String},
    address: {type: String},
    note: {type: String},
    createdAt: {type: Date, default: Date.now} 
});

module.exports = mongoose.model('Supplier', supplierSchema);