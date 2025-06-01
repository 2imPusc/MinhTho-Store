const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const productController = {
  //Create Product
  createProduct: async (req, res) => {
    try {
      const {
        code, name, price, importPrice, unit,
        imageUrl, location, category, description,
        supplierId, supplierInfo // 👈 thêm field này để linh hoạt
      } = req.body;

      // Kiểm tra mã sản phẩm đã tồn tại chưa
      const existing = await Product.findOne({ code });
      if (existing) return res.status(400).json({ message: 'Mã sản phẩm đã tồn tại!' });

      let supplier = null;

      // TH1: Có sẵn supplierId
      if (supplierId) {
        const foundSupplier = await Supplier.findById(supplierId);
        if (!foundSupplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp theo ID' });
        supplier = foundSupplier._id;
      }

      // TH2: Có thông tin supplier (name, phone, ...)
      else if (supplierInfo && supplierInfo.name) {
        const { name, phone } = supplierInfo;
        let found = await Supplier.findOne({ name, phone });

        if (!found) {
          const newSupplier = new Supplier(supplierInfo);
          found = await newSupplier.save();
        }

        supplier = found._id;
      }

      // TH3: Không có supplierId và cũng không có supplierInfo → giữ nguyên null

      const newProduct = new Product({
        code,
        name,
        price,
        importPrice,
        unit,
        imageUrl,
        location,
        category,
        description,
        supplier
      });

      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (err) {
      return res.status(500).json({ message: err.message });
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
      const {
        code, name, price, importPrice, unit,
        imageUrl, location, category, description,
        supplierId, supplierInfo
      } = req.body;

      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

      let supplier = null;

      // TH1: Có supplierId
      if (supplierId) {
        const foundSupplier = await Supplier.findById(supplierId);
        if (!foundSupplier) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp theo ID' });
        supplier = foundSupplier._id;
      }

      // TH2: Có supplierInfo (name là bắt buộc để tìm kiếm)
      else if (supplierInfo && supplierInfo.name) {
        const { name, phone } = supplierInfo;
        let found = await Supplier.findOne({ name, phone });

        if (!found) {
          const newSupplier = new Supplier(supplierInfo);
          found = await newSupplier.save();
        }

        supplier = found._id;
      }

      // Cập nhật các trường thông tin sản phẩm
      product.code = code || product.code;
      product.name = name || product.name;
      product.price = price || product.price;
      product.importPrice = importPrice || product.importPrice;
      product.unit = unit || product.unit;
      product.imageUrl = imageUrl || product.imageUrl;
      product.location = location || product.location;
      product.category = category || product.category;
      product.description = description || product.description;
      product.supplier = supplier || product.supplier; // cập nhật nếu có

      await product.save();

      res.status(200).json({ message: 'Cập nhật sản phẩm thành công', product });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  //Delete Product
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