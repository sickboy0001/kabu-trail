import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: { month: string; 資産額: number }[];
  className?: string;
};

export default function AssetHistoryChart({ data, className = "" }: Props) {
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
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        資産推移 (過去1年)
      </h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis
              tickFormatter={(value) =>
                `${(value / 10000).toLocaleString()}万円`
              }
              domain={["dataMin - 100000", "dataMax + 100000"]}
              fontSize={12}
              width={80}
            />
            <Tooltip
              formatter={(value) => {
                if (typeof value === "number") {
                  return [formatYen(value), "資産額"];
                }
                return [value, "資産額"];
              }}
            />
            <Bar dataKey="資産額" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
