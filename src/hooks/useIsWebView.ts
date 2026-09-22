'use client';
import { useState, useEffect } from 'react';

/**
 * Heuristic detection for "running inside a wrapped native WebView"
 * rather than a normal mobile browser — used to add forced bottom
 * clearance for gesture-bar/home-indicator UI that the WebView doesn't
 * report through env(safe-area-inset-bottom).
 */
export function useIsWebView(): boolean {
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    // Common WebView signatures: Android WebViews include "wv" in the UA;
    // a wrapping app's own custom UA (if the developer set one) would also
    // show up here — adjust this string if your Expo wrapper sets a custom
    // user agent you can match on instead.
    const androidWebView = /Android.*wv\)/.test(ua);
    const iosStandalone = (window.navigator as any).standalone === false && /iPhone|iPad/.test(ua) && !/Safari/.test(ua);
    setIsWebView(androidWebView || iosStandalone);
  }, []);

  return isWebView;
}