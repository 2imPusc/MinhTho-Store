import { useState, useEffect, useMemo } from "react";
import productService from "../services/productService";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getAll();
        setProducts(res.data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return cats.sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Hero / Search Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Minh Thọ - Điện Nước</h1>
          <p className="text-blue-100 mb-6">Tra cứu sản phẩm, giá cả nhanh chóng</p>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {filtered.length} sản phẩm {search || categoryFilter ? "được tìm thấy" : ""}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
                {search && (
                  <button
                    onClick={() => { setSearch(""); setCategoryFilter(""); }}
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                        <p className="text-xs text-gray-400 font-mono">{product.code}</p>
                      </div>
                      {product.category && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {product.category}
                        </span>
                      )}
                    </div>

                    <p className="text-xl font-bold text-blue-600 mb-3">
                      {product.price?.toLocaleString("vi-VN")}đ
                      {product.unit && (
                        <span className="text-sm font-normal text-gray-400">/{product.unit}</span>
                      )}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {product.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {product.location}
                        </span>
                      )}
                      {product.supplier?.name && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {product.supplier.name}
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
