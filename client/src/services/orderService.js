import api from "./api";

const orderService = {
  getAll: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getByCustomer: (customerId) => api.get(`/orders/customer/${customerId}`),
  create: (data) => api.post("/orders", data),
  addPayment: (id, data) => api.put(`/orders/${id}/payment`, data),
  markPaid: (id) => api.patch(`/orders/${id}/mark-paid`),
  delete: (id) => api.delete(`/orders/${id}`),
  bulkDelete: (ids) => api.post("/orders/bulk-delete", { ids }),
  bulkMarkPaid: (ids) => api.post("/orders/bulk-mark-paid", { ids }),
};

export default orderService;
