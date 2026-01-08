import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Holding } from "./DashboardClient";

type Props = {
  holdings: Holding[];
  className?: string;
};

export default function PortfolioPieChart({ holdings, className = "" }: Props) {
  const pieChartData = holdings.map((h) => ({
    name: h.name,
    value: h.currentPrice * h.quantity,
  }));

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#FF4444",
    "#33CC33",
    "#9900FF",
    "#00CCCC",
    "#FF00FF",
  ];

  const formatYen = (num: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(num);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 ${className}`}
    >
      <h2 className="text-lg font-bold text-slate-800 mb-4">ポートフォリオ</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                if (typeof value === "number") {
                  return formatYen(value);
                }
                return value;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
