import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

type VitalsMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
};

// Store metrics in memory for debugging
const metricsStore: VitalsMetric[] = [];

// Threshold definitions for ratings (Core Web Vitals standards)
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

const formatMetricValue = (name: string, value: number): string => {
  switch (name) {
    case 'CLS':
      return value.toFixed(3);
    case 'FCP':
    case 'LCP':
    case 'TTFB':
    case 'INP':
      return `${Math.round(value)}ms`;
    default:
      return value.toString();
  }
};

const getRatingEmoji = (rating: string): string => {
  switch (rating) {
    case 'good':
      return '🟢';
    case 'needs-improvement':
      return '🟡';
    case 'poor':
      return '🔴';
    default:
      return '⚪';
  }
};

// Debounce localStorage writes for better performance
let pendingMetrics: Array<VitalsMetric & { timestamp: string; url: string }> = [];
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (pendingMetrics.length === 0) return;
    
    try {
      const storedMetrics = JSON.parse(localStorage.getItem('web-vitals') || '[]');
      const combined = [...storedMetrics, ...pendingMetrics];
      
      // Keep only last 50 metrics
      const trimmed = combined.slice(-50);
      localStorage.setItem('web-vitals', JSON.stringify(trimmed));
      pendingMetrics = [];
    } catch (e) {
      // Ignore storage errors
    }
  }, 1000); // Batch writes every second
};

const handleMetric = (metric: Metric): void => {
  const vitalsMetric: VitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  };

  metricsStore.push(vitalsMetric);

  // Log in development with color coding
  if (import.meta.env.DEV) {
    const emoji = getRatingEmoji(metric.rating);
    const formattedValue = formatMetricValue(metric.name, metric.value);
    const color = metric.rating === 'good' ? '#22c55e' : metric.rating === 'needs-improvement' ? '#eab308' : '#ef4444';
    
    console.log(
      `%c${emoji} Web Vital: ${metric.name} = ${formattedValue} (${metric.rating})`,
      `color: ${color}; font-weight: 500;`
    );
  }

  // In production, batch and store metrics
  if (import.meta.env.PROD) {
    pendingMetrics.push({
      ...vitalsMetric,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
    });
    debouncedSave();
  }
};

export const initWebVitals = (): void => {
  try {
    // Use reportAllChanges: false for final values only (more accurate)
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    
    if (import.meta.env.DEV) {
      console.log('%c📊 Web Vitals monitoring initialized', 'color: #8b5cf6; font-weight: bold;');
    }
  } catch (error) {
    console.warn('Failed to initialize Web Vitals:', error);
  }
};

export const getStoredMetrics = (): VitalsMetric[] => {
  return [...metricsStore];
};

export const getLocalStorageMetrics = (): Array<VitalsMetric & { timestamp: string; url: string }> => {
  try {
    return JSON.parse(localStorage.getItem('web-vitals') || '[]');
  } catch {
    return [];
  }
};

export const clearStoredMetrics = (): void => {
  localStorage.removeItem('web-vitals');
  pendingMetrics = [];
};

// Performance summary helper
export const getPerformanceSummary = (): Record<string, { latest: VitalsMetric | null; average: number; count: number; threshold: { good: number; poor: number } }> => {
  const metrics = getLocalStorageMetrics();
  const summary: Record<string, { latest: VitalsMetric | null; average: number; count: number; threshold: { good: number; poor: number } }> = {};

  (['CLS', 'FCP', 'INP', 'LCP', 'TTFB'] as const).forEach((name) => {
    const filtered = metrics.filter((m) => m.name === name);
    const average = filtered.length > 0
      ? filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length
      : 0;
    
    summary[name] = {
      latest: filtered[filtered.length - 1] || null,
      average,
      count: filtered.length,
      threshold: THRESHOLDS[name],
    };
  });

  return summary;
};

// Quick health check - returns true if all metrics are good or needs-improvement
export const isPerformanceHealthy = (): boolean => {
  const summary = getPerformanceSummary();
  
  for (const [name, data] of Object.entries(summary)) {
    if (data.latest && data.latest.rating === 'poor') {
      return false;
    }
  }
  
  return true;
};
