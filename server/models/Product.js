const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    importPrice: { type: Number, required: true},
    unit: { type: String },
    imageUrl: { type: String },
    location: { type: String },
    category: {type: String},
    description: {type: String},
    supplier: {type: mongoose.Schema.Types.ObjectId, ref: 'Supplier'},
    createdAt: {type: Date, default: Date.now}
})

module.exports = mongoose.model('Product', productSchema);