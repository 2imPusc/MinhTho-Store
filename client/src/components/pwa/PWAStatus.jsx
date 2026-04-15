import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import toast from "react-hot-toast";
import { subscribe as subscribeQueue, getPendingCount, flush } from "../../offline/queue";

export default function PWAStatus() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl) {
            console.log("[PWA] Service worker registered:", swUrl);
        },
        onRegisterError(error) {
            console.error("[PWA] SW registration error:", error);
        },
    });

    useEffect(() => {
        const onOnline = () => {
            setIsOnline(true);
            toast.success("Đã kết nối lại mạng");
        };
        const onOffline = () => {
            setIsOnline(false);
            toast.error("Mất kết nối — đang dùng dữ liệu offline");
        };
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);

        const onBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        const onInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            toast.success("Đã cài MinhTho Store vào thiết bị");
        };
        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);

        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
        }

        getPendingCount().then(setPendingCount);
        const unsub = subscribeQueue(setPendingCount);

        return () => {
            unsub();
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setDeferredPrompt(null);
    };

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    return (
        <>
            {!isOnline && (
                <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-medium shadow-lg">
                    Offline {pendingCount > 0 ? `— ${pendingCount} thao tác chờ sync` : "— chỉ xem được dữ liệu đã lưu"}
                </div>
            )}

            {isOnline && pendingCount > 0 && (
                <button
                    onClick={() => flush()}
                    className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium shadow-lg hover:bg-blue-700"
                    title="Nhấn để đồng bộ ngay"
                >
                    Đang đồng bộ {pendingCount} thao tác...
                </button>
            )}

            {needRefresh && (
                <div className="fixed bottom-4 right-4 z-50 bg-white border border-blue-200 rounded-lg shadow-xl p-4 max-w-sm">
                    <p className="text-sm text-slate-700 mb-3">Đã có phiên bản mới của ứng dụng.</p>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setNeedRefresh(false)}
                            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
                        >
                            Để sau
                        </button>
                        <button
                            onClick={handleUpdate}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Cập nhật
                        </button>
                    </div>
                </div>
            )}

            {deferredPrompt && !isInstalled && (
                <button
                    onClick={handleInstall}
                    className="fixed bottom-4 left-4 z-40 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    title="Cài ứng dụng vào thiết bị"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Cài ứng dụng
                </button>
            )}
        </>
    );
}
