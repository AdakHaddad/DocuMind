"use client";

import React from 'react';
import { ArrowUpRight, BookOpen, Clock, TrendingUp } from 'lucide-react';

const accuracyData = [
  { name: '1', value: 60 },
  { name: '2', value: 70 },
  { name: '3', value: 65 },
  { name: '4', value: 75 },
  { name: '5', value: 70 },
  { name: '6', value: 68 },
  { name: '7', value: 72 },
  { name: '8', value: 80 },
  { name: '9', value: 78 },
  { name: '10', value: 82 },
];

const timeSpentData = [
  { name: '1', value: 60 },
  { name: '2', value: 55 },
  { name: '3', value: 65 },
  { name: '4', value: 50 },
  { name: '5', value: 45 },
  { name: '6', value: 52 },
  { name: '7', value: 48 },
  { name: '8', value: 40 },
  { name: '9', value: 42 },
  { name: '10', value: 38 },
];

interface SimpleLineChartProps {
  data: { name: string; value: number }[];
  strokeColor?: string;
  height?: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  strokeColor = "#3b82f6",
  height = 50,
}) => {
  const [ChartComponent, setChartComponent] = React.useState<React.ComponentType<any> | null>(null);

  React.useEffect(() => {
    import('recharts').then(recharts => {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = recharts;

      const Chart = () => (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{
              top: 3,
              right: 0,
              left: -25,
              bottom: 3,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={true} vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={false} width={30} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: strokeColor, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
      setChartComponent(() => Chart);
    });
  }, [data, strokeColor, height]);

  if (!ChartComponent) {
    return <div style={{ height: `${height}px` }} className="w-full flex items-center justify-center text-sm text-gray-500">Loading chart...</div>;
  }

  return <ChartComponent />;
};


interface StatisticCardProps {
  title: string;
  value: string;
  change: string;
  changeColorClass?: string; // e.g., "text-green-500" or "text-red-500"
  chartData: { name: string; value: number }[];
  chartColor?: string;
  unit?: string; // e.g. "%" or "s"
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  change,
  changeColorClass = "text-green-500",
  chartData,
  chartColor = "#3b82f6",
}) => {
  return (
    <div className="bg-gray-100 p-6 rounded-xl shadow-[-2px_2px_6px_0px_rgba(0,0,0,0.3)] w-full">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-xl font-semibold text-documind-text-primary">{title}</h2>
        <div className="text-right">
          <p className="text-2xl font-bold text-documind-primary">{value}</p>
          <p className={`text-sm font-medium ${changeColorClass}`}>{change}</p>
        </div>
      </div>
      <div className="h-fit">
        <SimpleLineChart data={chartData} strokeColor={chartColor} height={70}/>
      </div>
    </div>
  );
};

// Main Page Component
const StatisticsPage: React.FC = () => {
  return (
    <div className="w-full max-h-fit h-fit p-2 flex justify-center">
      <div className="w-full bg-white rounded-2xl"> 
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Your <span className="text-documind-primary">Statistics</span> 
          </h1>
          <span className="text-base text-gray-500 bg-blue-100 px-3 py-1 rounded-full"> 
            from <span className="font-semibold text-documind-secondary">10</span> attempts
          </span>
        </div>

        {/* Statistics Cards */}
        <div className="space-y-6 mb-4">
          <StatisticCard
            title="Accuracy"
            value="80.00%"
            change="+5%"
            changeColorClass="text-green-500"
            chartData={accuracyData}
            chartColor="#22c55e"
          />
          <StatisticCard
            title="Time Spent"
            value="50.00s"
            change="+3s"
            changeColorClass="text-red-500"
            chartData={timeSpentData}
            chartColor="#ef4444"
          />
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;

