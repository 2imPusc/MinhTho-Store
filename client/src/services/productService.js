import api from "./api";

const productService = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  bulkDelete: (ids) => api.post("/products/bulk-delete", { ids }),
  uploadImage: (file) => {
    const form = new FormData();
    form.append("image", file);
    return api.post("/products/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default productService;
