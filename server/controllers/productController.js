const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, buildSearchFilter } = require('../utils/paginate');

const resolveSupplier = async ({ supplierId, supplierInfo }) => {
  if (supplierId) {
    const found = await Supplier.findById(supplierId);
    if (!found) throw new AppError('Không tìm thấy nhà cung cấp theo ID', 404);
    return found._id;
  }
  if (supplierInfo && supplierInfo.name) {
    const { name, phone } = supplierInfo;
    let found = await Supplier.findOne({ name, phone });
    if (!found) found = await new Supplier(supplierInfo).save();
    return found._id;
  }
  return null;
};

const productController = {
  createProduct: asyncHandler(async (req, res) => {
    const {
      code, name, price, importPrice, unit,
      imageUrl, location, category, description,
      supplierId, supplierInfo
    } = req.body;

    const existing = await Product.findOne({ code });
    if (existing) throw new AppError('Mã sản phẩm đã tồn tại', 400);

    const supplier = await resolveSupplier({ supplierId, supplierInfo });

    const newProduct = new Product({
      code, name, price, importPrice, unit,
      imageUrl, location, category, description,
      supplier
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  }),

  getAllProducts: asyncHandler(async (req, res) => {
    const { page, limit, search, sort, category } = req.query;
    const filter = {
      ...buildSearchFilter(search, ['name', 'code', 'category']),
      ...(category ? { category } : {})
    };
    if (page !== undefined || limit !== undefined) {
      const result = await paginate(Product, {
        filter,
        sort: sort ? JSON.parse(sort) : { createdAt: -1 },
        page, limit,
        populate: 'supplier'
      });
      return res.status(200).json(result);
    }
    const allProducts = await Product.find(filter).populate('supplier').sort({ createdAt: -1 });
    res.status(200).json(allProducts);
  }),

  getProductById: asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('supplier');
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);
    res.status(200).json({ product });
  }),

  updateProduct: asyncHandler(async (req, res) => {
    const {
      code, name, price, importPrice, unit,
      imageUrl, location, category, description,
      supplierId, supplierInfo
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    const supplier = await resolveSupplier({ supplierId, supplierInfo });

    product.code = code || product.code;
    product.name = name || product.name;
    product.price = price ?? product.price;
    product.importPrice = importPrice ?? product.importPrice;
    product.unit = unit || product.unit;
    product.imageUrl = imageUrl || product.imageUrl;
    product.location = location || product.location;
    product.category = category || product.category;
    product.description = description || product.description;
    product.supplier = supplier || product.supplier;

    await product.save();
    res.status(200).json({ message: 'Cập nhật sản phẩm thành công', product });
  }),

  uploadImage: asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('Không có file được upload', 400);
    const host = `${req.protocol}://${req.get('host')}`;
    const url = `${host}/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename });
  }),

  deleteProduct: asyncHandler(async (req, res) => {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) throw new AppError('Không tìm thấy sản phẩm', 404);
    res.status(200).json({ message: 'Xóa sản phẩm thành công' });
  }),

  bulkDelete: asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Danh sách ID không hợp lệ', 400);
    }
    const result = await Product.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ message: `Đã xóa ${result.deletedCount} sản phẩm`, deletedCount: result.deletedCount });
  })
};

module.exports = productController;
