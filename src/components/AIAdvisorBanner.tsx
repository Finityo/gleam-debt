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
      <div className="glass-intense max-w-xl w-full rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-foreground mb-1">AI Advisor</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
