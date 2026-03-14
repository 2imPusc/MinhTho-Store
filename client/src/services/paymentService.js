import api from "./api";

const paymentService = {
  getAllDebts: () => api.get("/payments/debts"),
  getByCustomer: (customerId) => api.get(`/payments/customer/${customerId}`),
  getCustomerDebt: (customerId) => api.get(`/payments/customer/${customerId}/debt`),
  create: (data) => api.post("/payments", data),
  delete: (id) => api.delete(`/payments/${id}`),
};

export default paymentService;
