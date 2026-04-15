import api from "./api";

const customerService = {
  getAll: (params) => api.get("/customers", { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  bulkDelete: (ids) => api.post("/customers/bulk-delete", { ids }),
};

export default customerService;
