const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, buildSearchFilter } = require('../utils/paginate');

const customerController = {
  createCustomer: asyncHandler(async (req, res) => {
    const { name, phone, address, type, note } = req.body;
    const newCustomer = new Customer({ name, phone, address, type, note });
    await newCustomer.save();
    res.status(201).json(newCustomer);
  }),

  getAllCustomers: asyncHandler(async (req, res) => {
    const { page, limit, search, type } = req.query;
    const filter = {
      ...buildSearchFilter(search, ['name', 'phone', 'address']),
      ...(type ? { type } : {})
    };
    if (page !== undefined || limit !== undefined) {
      const result = await paginate(Customer, { filter, page, limit });
      return res.status(200).json(result);
    }
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.status(200).json(customers);
  }),

  getCustomerById: asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    if (!customer) throw new AppError('Không tìm thấy khách hàng', 404);
    res.status(200).json(customer);
  }),

  updateCustomer: asyncHandler(async (req, res) => {
    const { name, phone, address, type, note } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) throw new AppError('Không tìm thấy khách hàng', 404);

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (type !== undefined) customer.type = type;
    if (note !== undefined) customer.note = note;

    await customer.save();
    res.status(200).json({ message: 'Cập nhật khách hàng thành công', customer });
  }),

  deleteCustomer: asyncHandler(async (req, res) => {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) throw new AppError('Không tìm thấy khách hàng', 404);
    res.status(200).json({ message: 'Xóa khách hàng thành công' });
  }),

  bulkDelete: asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Danh sách ID không hợp lệ', 400);
    }
    const result = await Customer.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ message: `Đã xóa ${result.deletedCount} khách hàng`, deletedCount: result.deletedCount });
  })
};

module.exports = customerController;
