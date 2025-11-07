import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Props = {
  data: Array<{ month: number; remaining: number }>;
  title?: string;
};

export function ChartWithHover({ data, title = "Remaining Balance" }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black text-white text-xs px-3 py-2 rounded shadow-lg">
          <p className="font-medium">Month {payload[0].payload.month}</p>
          <p className="text-green-400">
            Balance: ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, index } = props;
    const isActive = activeIndex === index;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={isActive ? 6 : 3}
        fill="#000"
        stroke="#fff"
        strokeWidth={isActive ? 2 : 0}
        className="transition-all duration-200"
        onMouseEnter={() => setActiveIndex(index)}
        onMouseLeave={() => setActiveIndex(null)}
      />
    );
  };

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-medium">{title}</h3>}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={data}
          onMouseLeave={() => setActiveIndex(null)}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            label={{ value: "Month", position: "insideBottom", offset: -5 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{ value: "Balance ($)", angle: -90, position: "insideLeft" }}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="#000"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
