import axios from "axios";
import toast from "react-hot-toast";
import { isQueueable, enqueue, flush } from "../offline/queue";

// Khi build production và FE được serve cùng origin với BE (qua Cloudflare Tunnel),
// dùng path tương đối "/api" → tự động theo protocol + host hiện tại.
const SAME_ORIGIN_API = "/api";
const LOCAL_API = import.meta.env.VITE_LOCAL_API_URL || "http://192.168.1.100:5000/api";
const CLOUD_API = import.meta.env.VITE_CLOUD_API_URL || "http://localhost:5000/api";
// Nếu đang chạy trên production origin (không phải dev Vite) → luôn dùng same-origin.
const IS_PROD_ORIGIN = typeof window !== "undefined" && !["5173", "4173"].includes(window.location.port);

// Try local backend first, fallback to cloud
const detectApiUrl = async () => {
  if (IS_PROD_ORIGIN) return SAME_ORIGIN_API;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    await axios.get(LOCAL_API.replace("/api", "/api/products"), {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return LOCAL_API;
  } catch {
    return CLOUD_API;
  }
};

let resolvedUrl = IS_PROD_ORIGIN ? SAME_ORIGIN_API : CLOUD_API;

const api = axios.create({
  baseURL: resolvedUrl,
  withCredentials: false,
});

detectApiUrl().then((url) => {
  resolvedUrl = url;
  api.defaults.baseURL = url;
  console.log("API:", url === LOCAL_API ? "Local" : "Cloud", url);
});

api.interceptors.request.use((config) => {
  config.baseURL = resolvedUrl;
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: auto-refresh access token + toast lỗi ---
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

const forceLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    // Không tự refresh cho chính route auth
    const isAuthRoute = url.includes("/auth/");

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đợi refresh đang chạy
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${resolvedUrl}/auth/refresh-token`, { refreshToken });
        const newToken = res.data.token;
        const newRefresh = res.data.refreshToken;
        localStorage.setItem("token", newToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
        flushQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        flushQueue(err, null);
        forceLogout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Offline queue: nếu không có response (network error) + request ghi an toàn → enqueue
    if (!error.response && isQueueable(originalRequest)) {
      const body = await enqueue(originalRequest);
      toast("Mất mạng — đã lưu vào hàng đợi, sẽ đồng bộ sau", { icon: "📥" });
      // Trả fake response để UI tiếp tục (optimistic)
      return Promise.resolve({
        data: { message: "Queued offline", queued: true, clientId: body.clientId },
        status: 202,
        config: originalRequest,
      });
    }

    // Toast thông báo lỗi (trừ 401 đã xử lý refresh)
    const msg = error.response?.data?.message;
    if (msg && status !== 401) {
      toast.error(msg);
    } else if (!error.response) {
      toast.error("Không kết nối được máy chủ");
    }

    return Promise.reject(error);
  }
);

export { flush as flushOfflineQueue };
export default api;
