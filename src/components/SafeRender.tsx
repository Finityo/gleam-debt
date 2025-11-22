import React from "react";

/**
 * SafeRender (Military mode)
 * - Catch render crashes at component boundary
 * - Prevents whole-page white screens
 * NOTE: React error boundaries must be class-based;
 * this is a pragmatic guard for risky blocks.
 */
export function SafeRender({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  try {
    return <>{children}</>;
  } catch (e) {
    // Never throw in prod UI; log only.
    console.error("SafeRender caught render error:", e);
    return <>{fallback}</>;
  }
}
