import React from "react";
import { Sparkles } from "lucide-react";

export default function AIAdvisorBanner({ 
  visible, 
  message 
}: { 
  visible: boolean; 
  message: string;
}) {
  if (!visible) return null;
  
  return (
    <div className="fixed inset-x-0 bottom-8 flex justify-center z-40 px-4">
      <div className="max-w-xl w-full rounded-2xl p-4 shadow-2xl bg-white/15 backdrop-blur-md border border-white/30 animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/20 border border-white/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white mb-1">AI Advisor</div>
            <p className="text-sm text-white/80 leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
