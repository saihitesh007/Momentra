"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface BudgetChartProps {
  data: { name: string; value: number; color: string }[];
  currencySymbol: string;
}

/** Draws a responsive budget donut chart after the active budget tab loads. */
export default function BudgetChart({ data, currencySymbol }: BudgetChartProps) {
  return (
    <div role="img" aria-label="Estimated budget allocation by category" className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(value) => [`${currencySymbol}${Number(value ?? 0).toLocaleString("en-IN")}`, ""]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
