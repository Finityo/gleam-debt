import React from "react";
import { useNavigate } from "react-router-dom";
import { PopIn } from "./Animate";

export default function NextBack({
  back,
  next,
  nextDisabled,
  nextLabel = "Next",
  className = "",
}: {
  back?: string;
  next?: string;
  nextDisabled?: boolean;
  nextLabel?: string;
  className?: string;
}) {
  const nav = useNavigate();
  
  return (
    <PopIn delay={0.05}>
      <div className={`mt-8 flex items-center justify-between gap-4 ${className}`}>
        <button
          onClick={() => (back ? nav(back) : nav(-1))}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur-sm"
        >
          Back
        </button>
        {next && (
          <button
            onClick={() => nav(next)}
            disabled={nextDisabled}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLabel}
          </button>
        )}
      </div>
    </PopIn>
  );
}
