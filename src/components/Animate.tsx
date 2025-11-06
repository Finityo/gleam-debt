import React from "react";
import { motion } from "framer-motion";

export function PageFade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function PopIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
