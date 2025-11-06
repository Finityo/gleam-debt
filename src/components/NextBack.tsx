import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
    <div className={`mt-8 flex items-center justify-between gap-4 ${className}`}>
      <Button
        variant="outline"
        onClick={() => (back ? nav(back) : nav(-1))}
        className="glass border-white/20"
      >
        Back
      </Button>
      {next && (
        <Button
          onClick={() => nav(next)}
          disabled={nextDisabled}
          className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
