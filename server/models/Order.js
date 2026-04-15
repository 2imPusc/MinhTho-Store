const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    clientId: {type: String, index: {unique: true, sparse: true}}, // dedup khi sync offline
    customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer'},
    items: [
        {
            product: {type: mongoose.Schema.Types.ObjectId, ref: 'Product'},
            quantity: {type: Number, require: true},
            price: {type: Number} // snapshot gia tai thoi diem tao don
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
    note: {type: String},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    createdAt: {type: Date, default: Date.now}
})

orderSchema.virtual('isFullyPaid').get(function () {
  return this.paidAmount >= this.totalAmount;
});

module.exports = mongoose.model('Order', orderSchema);
