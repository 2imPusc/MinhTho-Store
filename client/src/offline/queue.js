import axios from "axios";
import toast from "react-hot-toast";
import { db, MUTATION_STATUS } from "./db";

// Chỉ queue các mutation "ghi mới" an toàn khi offline.
// KHÔNG queue DELETE/PUT phức tạp để tránh conflict khó giải quyết.
const QUEUEABLE_ENDPOINTS = [
  { method: "POST", match: /\/orders$/ },
  { method: "POST", match: /\/orders\/[^/]+\/payments$/ }, // add payment per-order
  { method: "POST", match: /\/payments$/ },
];

export const isQueueable = (config) => {
  const method = (config.method || "get").toUpperCase();
  const url = (config.url || "").replace(/^https?:\/\/[^/]+/, "");
  return QUEUEABLE_ENDPOINTS.some((r) => r.method === method && r.match.test(url));
};

export const genClientId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const enqueue = async (config) => {
  // Đảm bảo body có clientId để BE dedup
  const body = { ...(config.data || {}) };
  if (!body.clientId) body.clientId = genClientId();

  await db.pendingMutations.add({
    method: config.method.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    body,
    headers: {
      Authorization: config.headers?.Authorization,
    },
    clientId: body.clientId,
    status: MUTATION_STATUS.PENDING,
    retries: 0,
    lastError: null,
    createdAt: Date.now(),
  });

  notifySubscribers();
  return body;
};

export const getPendingCount = async () => {
  return db.pendingMutations.where("status").notEqual(MUTATION_STATUS.SYNCING).count();
};

export const listPending = async () => {
  return db.pendingMutations.orderBy("createdAt").toArray();
};

export const removeMutation = async (id) => {
  await db.pendingMutations.delete(id);
  notifySubscribers();
};

let flushing = false;

export const flush = async () => {
  if (flushing) return;
  if (!navigator.onLine) return;
  flushing = true;

  try {
    const items = await db.pendingMutations
      .where("status")
      .notEqual(MUTATION_STATUS.SYNCING)
      .sortBy("createdAt");

    for (const item of items) {
      await db.pendingMutations.update(item.id, { status: MUTATION_STATUS.SYNCING });
      try {
        await axios.request({
          method: item.method,
          url: item.url,
          baseURL: item.baseURL,
          data: item.body,
          headers: {
            ...(item.headers?.Authorization ? { Authorization: item.headers.Authorization } : {}),
            "X-Refreshed-Token": localStorage.getItem("token") || "",
          },
          // Ưu tiên token mới nếu đã refresh từ lúc queue
          transformRequest: [
            (data, headers) => {
              const t = localStorage.getItem("token");
              if (t) headers.Authorization = `Bearer ${t}`;
              return JSON.stringify(data);
            },
          ],
        });
        await db.pendingMutations.delete(item.id);
      } catch (err) {
        const status = err.response?.status;
        // 4xx không phải 401 → bad request, không retry nữa
        if (status && status >= 400 && status < 500 && status !== 401) {
          await db.pendingMutations.update(item.id, {
            status: MUTATION_STATUS.FAILED,
            retries: (item.retries || 0) + 1,
            lastError: err.response?.data?.message || err.message,
          });
          toast.error(`Đồng bộ lỗi: ${err.response?.data?.message || err.message}`);
        } else {
          // network / 5xx → giữ pending để retry sau
          await db.pendingMutations.update(item.id, {
            status: MUTATION_STATUS.PENDING,
            retries: (item.retries || 0) + 1,
            lastError: err.message,
          });
          break; // dừng vòng lặp, retry sau
        }
      }
    }
  } finally {
    flushing = false;
    notifySubscribers();
  }
};

// --- Pub/sub đơn giản cho UI badge ---
const subscribers = new Set();

export const subscribe = (cb) => {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
};

const notifySubscribers = () => {
  getPendingCount().then((count) => {
    subscribers.forEach((cb) => cb(count));
  });
};

// --- Tự động flush ---
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    toast.success("Có mạng — đang đồng bộ dữ liệu ngoại tuyến...");
    flush();
  });

  // Flush định kỳ phòng khi online event không fire (mobile background)
  setInterval(() => {
    if (navigator.onLine) flush();
  }, 30_000);

  // Flush lúc khởi động nếu có item tồn đọng
  if (navigator.onLine) flush();
}
