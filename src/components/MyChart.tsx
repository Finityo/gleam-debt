interface ChartData {
  monthIndex: number;
  remaining: number;
}

interface MyChartProps {
  data: ChartData[];
}

export function MyChart({ data }: MyChartProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No data to display</p>;
  }

  // SVG chart dimensions
  const width = 800;
  const height = 300;
  const padding = 40;
  
  const maxRemaining = Math.max(...data.map(d => d.remaining), 1);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Scale functions
  const xScale = (monthIndex: number) => 
    padding + (monthIndex / Math.max(data.length - 1, 1)) * chartWidth;
  
  const yScale = (remaining: number) => 
    height - padding - (remaining / maxRemaining) * chartHeight;
  
  // Create path
  const pathData = data.map((d, i) => {
    const x = xScale(d.monthIndex);
    const y = yScale(d.remaining);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(" ");

  return (
    <svg 
      width={width} 
      height={height} 
      className="w-full h-auto border border-border rounded bg-background"
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Y-axis */}
      <line 
        x1={padding} 
        y1={padding} 
        x2={padding} 
        y2={height - padding} 
        stroke="currentColor" 
        strokeOpacity={0.3}
      />
      
      {/* X-axis */}
      <line 
        x1={padding} 
        y1={height - padding} 
        x2={width - padding} 
        y2={height - padding} 
        stroke="currentColor" 
        strokeOpacity={0.3}
      />
      
      {/* Chart line */}
      <path 
        d={pathData} 
        fill="none" 
        stroke="hsl(var(--primary))" 
        strokeWidth={2}
      />
      
      {/* Data points */}
      {data.map((d) => (
        <circle
          key={d.monthIndex}
          cx={xScale(d.monthIndex)}
          cy={yScale(d.remaining)}
          r={4}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--background))"
          strokeWidth={2}
        />
      ))}
      
      {/* Y-axis labels */}
      <text 
        x={padding - 10} 
        y={padding} 
        fontSize={12} 
        fill="currentColor"
        textAnchor="end"
      >
        ${maxRemaining.toFixed(0)}
      </text>
      
      <text 
        x={padding - 10} 
        y={height - padding} 
        fontSize={12} 
        fill="currentColor"
        textAnchor="end"
      >
        $0
      </text>
      
      {/* X-axis label */}
      <text 
        x={width / 2} 
        y={height - 10} 
        fontSize={12} 
        fill="currentColor"
        textAnchor="middle"
      >
        Months
      </text>
    </svg>
  );
}
