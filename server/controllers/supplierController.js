const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

const supplierController = {
    //Create Supplier
    createSupplier: async (req, res) => {
        try {
            const {name, phone, paymentInfo, address, note} = req.body;

            const existingSupplier = await Supplier.findOne({ $or: [{name}, {phone}]});
            if (existingSupplier) return res.status(400).json({message: 'Nha cung cap da ton tai'});

            const newSupllier = new Supplier({name, phone, paymentInfo, address, note});
            await newSupllier.save();

            res.status(201).json({message: 'Nha cung cap da duoc tao'});
        } catch (err) {
            return res.status(500).json({message: err.message});
        }
    },

    //Get all Suppliers
    getAllSuppliers: async (req, res) => {
        try {
            const allSuppliers = await Supplier.find().select('-__v');
            res.status(200).json({allSuppliers});
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    },

    //Get Suppliers by ID
    getSupplierById: async (req, res) => {
        try {
            const supplier = await Supplier.findById(req.params.id).select('-__v');
            if (!supplier) {
                return res.status(404).json({message: 'Nha cung cap khong ton tai'});
            }
            res.status(200).json({supplier})
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    },

    //Update Supplier
    updateSupplier: async (req, res) => {
        try {
            const {name, phone, paymentInfo, address, note} = req.body;
            const supplier = await Supplier.findById(req.params.id);

            if (!supplier) {
                return res.status(404).json({message: 'Nha cung cap khong ton tai'});
            }

            const existingSupplier = await Supplier.findOne({
                $or: [{name}, {phone}],
                _id: {$ne: req.params.id}
            });

            if (existingSupplier) {
                res.status(400).json({message: 'Loi trung lap voi nha cung cap da ton tai'});
            }

            supplier.name = name || supplier.name;
            supplier.phone = phone || supplier.phone;
            supplier.paymentInfo = paymentInfo || supplier.paymentInfo;
            supplier.address = address || supplier.address;
            supplier.note = note || supplier.note;

            await supplier.save();
            res.status(200).json({message: 'Cap nhat thanh cong', supplier});
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    },
    
    //Delete Supplier
    deleteSupplier: async (req, res) => {
        try {
           const supplier = await Supplier.findById(req.params.id);
           
           if (!supplier) return res.status(400).json({message: 'Nha cung cap khong ton tai'});

           const productCount = await Product.countDocuments({supplier: req.params.id});
           if (productCount > 0) {
            return res.status(400).json({message: 'Khong the sao vi co cac san pham dang lien ket'});
           }

           await supplier.deleteOne();
           res.status(200).json({message: 'Nha cung cap da duoc xoa'});
        } catch (error) {
            res.status(500).json({message: error.message});
        }
    }
}

module.exports = supplierController;