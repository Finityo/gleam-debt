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
        className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
      >
        Back
      </Button>
      {next && (
        <Button
          onClick={() => nav(next)}
          disabled={nextDisabled}
          className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
