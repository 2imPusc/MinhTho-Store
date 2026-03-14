const Customer = require('../models/Customer');

const customerController = {
  createCustomer: async (req, res) => {
    try {
      const { name, phone, address, type, note } = req.body;
      const newCustomer = new Customer({ name, phone, address, type, note });
      await newCustomer.save();
      res.status(201).json(newCustomer);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  getAllCustomers: async (req, res) => {
    try {
      const customers = await Customer.find().sort({ createdAt: -1 });
      res.status(200).json(customers);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  getCustomerById: async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Khong tim thay khach hang' });
      res.status(200).json(customer);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  updateCustomer: async (req, res) => {
    try {
      const { name, phone, address, type, note } = req.body;
      const customer = await Customer.findById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Khong tim thay khach hang' });

      if (name !== undefined) customer.name = name;
      if (phone !== undefined) customer.phone = phone;
      if (address !== undefined) customer.address = address;
      if (type !== undefined) customer.type = type;
      if (note !== undefined) customer.note = note;

      await customer.save();
      res.status(200).json({ message: 'Cap nhat khach hang thanh cong', customer });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  deleteCustomer: async (req, res) => {
    try {
      await Customer.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Xoa khach hang thanh cong' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports = customerController;
