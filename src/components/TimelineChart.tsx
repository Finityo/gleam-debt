import React from "react";

export function TimelineChart({
  plan,
  hoverIndex,
  setHoverIndex,
}: {
  plan: any;
  hoverIndex: number | null;
  setHoverIndex: (i: number | null) => void;
}) {
  const months = plan?.months ?? [];
  if (!months.length)
    return <div className="text-xs text-gray-400">No data</div>;

  const remaining = months.map((m: any) => m.remaining);
  const max = Math.max(...remaining);
  const min = Math.min(...remaining);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        className="w-full h-40"
        viewBox={`0 0 ${months.length} 100`}
        preserveAspectRatio="none"
      >
        {months.map((m: any, i: number) => {
          const y =
            100 -
            ((m.remaining - min) / (max - min || 1)) * 100; // normalize
          const x = i;
          const isHover = hoverIndex === i;

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isHover ? 2.4 : 1.7}
              stroke="none"
              fill={isHover ? "#10E7CD" : "#00C2FF"}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-pointer"
            />
          );
        })}
      </svg>
    </div>
  );
}
