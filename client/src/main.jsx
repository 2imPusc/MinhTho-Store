import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import PWAStatus from "./components/pwa/PWAStatus";

createRoot(document.getElementById("root")).render(
    <AuthProvider>
      <App />
      <PWAStatus />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </AuthProvider>
);
