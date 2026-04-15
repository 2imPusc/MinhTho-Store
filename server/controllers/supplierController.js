const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const supplierController = {
    createSupplier: asyncHandler(async (req, res) => {
        const { name, phone, paymentInfo, address, note } = req.body;

        const existingSupplier = await Supplier.findOne({ $or: [{ name }, { phone }] });
        if (existingSupplier) throw new AppError('Nhà cung cấp đã tồn tại', 400);

        const newSupplier = new Supplier({ name, phone, paymentInfo, address, note });
        await newSupplier.save();

        res.status(201).json({ message: 'Nhà cung cấp đã được tạo', supplier: newSupplier });
    }),

    getAllSuppliers: asyncHandler(async (req, res) => {
        const allSuppliers = await Supplier.find().select('-__v');
        res.status(200).json({ allSuppliers });
    }),

    getSupplierById: asyncHandler(async (req, res) => {
        const supplier = await Supplier.findById(req.params.id).select('-__v');
        if (!supplier) throw new AppError('Nhà cung cấp không tồn tại', 404);
        res.status(200).json({ supplier });
    }),

    updateSupplier: asyncHandler(async (req, res) => {
        const { name, phone, paymentInfo, address, note } = req.body;
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) throw new AppError('Nhà cung cấp không tồn tại', 404);

        const duplicate = await Supplier.findOne({
            $or: [{ name }, { phone }],
            _id: { $ne: req.params.id }
        });
        if (duplicate) throw new AppError('Trùng lặp với nhà cung cấp đã tồn tại', 400);

        supplier.name = name || supplier.name;
        supplier.phone = phone || supplier.phone;
        supplier.paymentInfo = paymentInfo || supplier.paymentInfo;
        supplier.address = address || supplier.address;
        supplier.note = note || supplier.note;

        await supplier.save();
        res.status(200).json({ message: 'Cập nhật thành công', supplier });
    }),

    deleteSupplier: asyncHandler(async (req, res) => {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) throw new AppError('Nhà cung cấp không tồn tại', 404);

        const productCount = await Product.countDocuments({ supplier: req.params.id });
        if (productCount > 0) {
            throw new AppError('Không thể xóa vì còn sản phẩm đang liên kết', 400);
        }

        await supplier.deleteOne();
        res.status(200).json({ message: 'Nhà cung cấp đã được xóa' });
    })
};

module.exports = supplierController;
