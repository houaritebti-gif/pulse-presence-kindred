import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "./utils/webVitals";

// Initialize Web Vitals monitoring early
initWebVitals();

/**
 * Remove the initial HTML loader with smooth transition
 */
const removeInitialLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (!loader) return;
  
  // Mark app as ready for CSS transition
  document.documentElement.classList.add('app-ready');
  document.documentElement.classList.remove('app-loading');
  
  // Use RAF for buttery smooth removal
  requestAnimationFrame(() => {
    loader.style.cssText = 'opacity:0;transition:opacity 0.12s ease-out;pointer-events:none';
    
    // Remove from DOM after transition
    setTimeout(() => {
      loader.remove();
      
      // Log performance in dev mode
      if (import.meta.env.DEV) {
        const perfStart = (window as { __PERF_START__?: number }).__PERF_START__;
        if (perfStart && 'performance' in window) {
          const loadTime = Math.round(performance.now() - perfStart);
          console.log(`[Performance] React hydrated in ${loadTime}ms`);
        }
      }
    }, 120);
  });
};

/**
 * In Lovable preview environments, mobile browsers can get stuck on a stale Service Worker.
 * We self-heal by unregistering SW + clearing CacheStorage once per session.
 */
const shouldResetPreviewCaches = () => {
  const host = window.location.hostname;
  return host.includes("lovableproject.com") || host.startsWith("id-preview--");
};

const resetPreviewCachesOnce = async () => {
  if (!shouldResetPreviewCaches()) return;

  const markerKey = "__kiki_preview_cache_reset_v2";
  if (sessionStorage.getItem(markerKey) === "1") return;
  sessionStorage.setItem(markerKey, "1");

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // Silent fail
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // Silent fail
  }

  // Reload once to ensure fresh bundles
  window.location.reload();
};

/**
 * Mount the React application
 */
const mountApp = () => {
  const container = document.getElementById("root")!;
  
  // Remove loader before mounting to prevent flash
  removeInitialLoader();
  
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Bootstrap the application
(async () => {
  // Reset caches in preview environments (may trigger reload)
  await resetPreviewCachesOnce();
  
  // Mount React app
  mountApp();
})();
