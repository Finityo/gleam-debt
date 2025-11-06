import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function AIAdvisor({
  visible,
  message,
  actionText,
  onAction,
}: {
  visible: boolean;
  message: string;
  actionText?: string;
  onAction?: () => void;
}) {
  if (!visible) return null;

  return (
    <motion.div
      className="fixed inset-x-0 bottom-8 flex justify-center z-40 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="max-w-xl w-full rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/20 border border-white/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white mb-1">AI Advisor</div>
            <p className="text-white/90 text-sm leading-relaxed">{message}</p>
            {actionText && onAction && (
              <div className="mt-3">
                <button
                  onClick={onAction}
                  className="px-4 py-2 rounded-xl text-sm text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 transition-all"
                >
                  {actionText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
