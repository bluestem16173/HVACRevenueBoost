"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type GraphPoint = { x: number; y: number };

export type GraphSeries = {
  label: string;
  points: GraphPoint[];
};

export type GraphBlock = {
  title: string;
  subtitle?: string;
  xLabel: string;
  yLabel: string;
  series: GraphSeries[];
  takeaway?: string;
};

export default function AuthorityGraph({ data }: { data: GraphBlock }) {
  if (!data || !data.series || data.series.length === 0) return null;

  // Normalize points into a unified data array for Recharts
  const allXValues = Array.from(
    new Set(data.series.flatMap((s) => s.points.map((p) => p.x)))
  ).sort((a, b) => a - b);

  const chartData = allXValues.map((x) => {
    const point: any = { x };
    data.series.forEach((s) => {
      const match = s.points.find((p) => p.x === x);
      if (match) {
        point[s.label] = match.y;
      }
    });
    return point;
  });

  const colors = ["#2878FF", "#F59E0B"]; // hvac-blue, amber-500

  return (
    <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-xl mb-12">
      <div className="mb-6">
        <h3 className="text-2xl font-black text-white">{data.title}</h3>
        {data.subtitle && (
          <p className="text-slate-400 font-medium mt-1">{data.subtitle}</p>
        )}
      </div>

      <div className="h-[300px] w-full text-sm font-bold">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="x" 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8' }}
              label={{ value: data.xLabel, position: 'insideBottom', offset: -15, fill: '#cbd5e1', fontWeight: 'bold' }} 
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8' }}
              label={{ value: data.yLabel, angle: -90, position: 'insideLeft', offset: 15, fill: '#cbd5e1', fontWeight: 'bold' }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '10px' }} />
            {data.series.map((s, idx) => (
              <Line
                key={s.label}
                type="monotone"
                dataKey={s.label}
                stroke={colors[idx % colors.length]}
                strokeWidth={4}
                dot={{ r: 5, fill: colors[idx % colors.length], strokeWidth: 0 }}
                activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.takeaway && (
        <div className="mt-8 bg-slate-800/50 border-l-4 border-hvac-blue p-5 rounded-r-xl">
          <p className="text-white m-0 font-medium leading-relaxed">
            <strong className="text-hvac-blue block text-xs uppercase tracking-widest mb-2 font-black">Key Takeaway</strong>
            {data.takeaway}
          </p>
        </div>
      )}
    </div>
  );
}
