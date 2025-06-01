const Product = require('../models/Product');

const productController = {
  //Create Product
  createProduct: async (req, res) => {
    try {
      const existing = await Product.findOne({code});
      if (existing) return res.status(400).json({message: 'Ma san pham da ton tai!'});

      const newProduct = new Product(req.body);
      await newProduct.save();
      res.status(201).json(newProduct); 
    } catch (err) {
      return res.status(500).json({message: err.message})
    }
  },

  //Get all Product
  getAllProducts: async (req, res) => {
    try {
      const allProducts = await Product.find().populate('supplier');
      res.status(200).json(allProducts);
    } catch (err) {
      return res.status(500).json({message: err.message});
    }
  },

  //Get Product by ID
  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).populate('supplier');
      if (!product) return res.status(404).json({message: 'Khong tim thay san pham'});
      res.status(200).json({product});
    } catch (err) {
      return res.status(500).json({message: err.message})
    }
  },

  //Update Product
  updateProduct: async (req, res) => {
    try {
      const updateProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {new: true});
      if (!updateProduct) return res.status(404).json({message: 'Khong tim thay san pham'});
      res.status(200).json(update)
    } catch (err) {
      return res.status(500).json({message: err.message});
    }
  },

  deleteProduct: async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.status(200).json({message: 'Xoa san pham thanh cong'});
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  }
}

module.exports = productController;