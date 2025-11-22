import React from "react";

/**
 * Prevents white screens from hard crashes in complex plan pages.
 * Usage: <SafeRender fallback={...}>{children}</SafeRender>
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
    console.error("SafeRender caught render error:", e);
    return <>{fallback}</>;
  }
}
