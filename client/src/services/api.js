import axios from "axios";

const LOCAL_API = import.meta.env.VITE_LOCAL_API_URL || "http://192.168.1.100:5000/api";
const CLOUD_API = import.meta.env.VITE_CLOUD_API_URL || "http://localhost:5000/api";

// Try local backend first, fallback to cloud
const detectApiUrl = async () => {
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

// Start with cloud as default, update once detected
let resolvedUrl = CLOUD_API;

const api = axios.create({
  baseURL: resolvedUrl,
  withCredentials: false,
});

// Detect and update baseURL on app load
detectApiUrl().then((url) => {
  resolvedUrl = url;
  api.defaults.baseURL = url;
  console.log("API:", url === LOCAL_API ? "Local" : "Cloud", url);
});

api.interceptors.request.use((config) => {
  // Ensure latest baseURL is used
  config.baseURL = resolvedUrl;
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
