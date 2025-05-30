const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    User: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    items: [
        {
            product: {type: mongoose.Schema.Types.ObjectId, ref: 'Product'},
            quantity: {type: Number, require: true}
        }
    ],
    totalAmount: {type: Number, required: true},
    paidAmount: {type: Number, default: 0},
    paymentHistory: [
        {
            amount: {type: Number, required: true},
            date: {type: Date, default: Date.now},
            method: {type: String},
            note: {type: String}
        }
    ],
    createdAt: {type: Date, default: Date.now}
})

orderSchema.virtual('isFullyPaid').get(function () {
  return this.paidAmount >= this.totalAmount;
});

module.exports = mongoose.model('Order', orderSchema);