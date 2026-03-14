import api from "./api";

const orderService = {
  getAll: () => api.get("/orders"),
  getById: (id) => api.get(`/orders/${id}`),
  getByCustomer: (customerId) => api.get(`/orders/customer/${customerId}`),
  create: (data) => api.post("/orders", data),
  addPayment: (id, data) => api.put(`/orders/${id}/payment`, data),
  markPaid: (id) => api.patch(`/orders/${id}/mark-paid`),
  delete: (id) => api.delete(`/orders/${id}`),
};

export default orderService;
