import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "./utils/webVitals";

// Initialize Web Vitals monitoring
initWebVitals();

/**
 * In Lovable preview environments, mobile browsers can get stuck on a stale Service Worker/app-shell.
 * We aggressively self-heal by unregistering SW + clearing CacheStorage once per session.
 * This does NOT run on the published site.
 */
const shouldResetPreviewCaches = () => {
  const host = window.location.hostname;
  return host.includes("lovableproject.com") || host.startsWith("id-preview--");
};

const resetPreviewCachesOnce = async () => {
  if (!shouldResetPreviewCaches()) return;

  const markerKey = "__kiki_preview_cache_reset_v1";
  if (sessionStorage.getItem(markerKey) === "1") return;
  sessionStorage.setItem(markerKey, "1");

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // Ignore
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // Ignore
  }

  // Reload once to ensure fresh bundles are fetched
  window.location.reload();
};

const renderApp = () => {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

(async () => {
  // If this triggers a reload, renderApp won't matter.
  await resetPreviewCachesOnce();
  renderApp();
})();
