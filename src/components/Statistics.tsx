"use client";

import React from "react";
import { SingleStatistic } from "./pages/Questions";

interface SimpleLineChartProps {
  data: { name: string; value: number }[];
  strokeColor?: string;
  height?: number;
}

interface ChartComponentProps {
  data?: { name: string; value: number }[];
  strokeColor?: string;
  height?: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  strokeColor = "#3b82f6",
  height = 50
}) => {
  const [ChartComponent, setChartComponent] =
    React.useState<React.ComponentType<ChartComponentProps> | null>(null);

  React.useEffect(() => {
    import("recharts").then((recharts) => {
      const {
        LineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        ResponsiveContainer
      } = recharts;

      const Chart = () => (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{
              top: 3,
              right: 0,
              left: -25,
              bottom: 3
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              strokeOpacity={0.2}
              horizontal={true}
              vertical={false}
            />
            <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={false} width={30} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: strokeColor,
                stroke: "#fff",
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
      setChartComponent(() => Chart);
    });
  }, [data, strokeColor, height]);

  if (!ChartComponent) {
    return (
      <div
        style={{ height: `${height}px` }}
        className="w-full flex items-center justify-center text-sm text-gray-500"
      >
        Loading chart...
      </div>
    );
  }

  return <ChartComponent />;
};

interface StatisticCardProps {
  title: string;
  value: string;
  change: string;
  changeColorClass?: string;
  chartData: { name: string; value: number }[];
  chartColor?: string;
  unit?: string;
}

const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  change,
  changeColorClass = "text-green-500",
  chartData,
  chartColor = "#3b82f6"
}) => {
  return (
    <div className="bg-gray-100 p-6 rounded-xl shadow-[-2px_2px_6px_0px_rgba(0,0,0,0.3)] w-full">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-xl font-semibold text-documind-text-primary">
          {title}
        </h2>
        <div className="text-right">
          <p className="text-2xl font-bold text-documind-primary">{value}</p>
          <p className={`text-sm font-medium ${changeColorClass}`}>{change}</p>
        </div>
      </div>
      <div className="h-fit">
        <SimpleLineChart
          data={chartData}
          strokeColor={chartColor}
          height={70}
        />
      </div>
    </div>
  );
};

const StatisticsPage = ({ statistics }: { statistics: SingleStatistic[] }) => {
  const validStats = statistics
    .filter(
      (stat) => stat.timeEnd != null && !isNaN(new Date(stat.timeEnd).getTime())
    )
    .map((stat) => ({
      ...stat,
      accuracy: stat.accuracy != null ? Number(stat.accuracy) : null,
      timeSpent: stat.timeSpent != null ? Number(stat.timeSpent) : null
    }));

  const accuracyData = validStats.map((stat, index) => ({
    name: `${index + 1}`,
    value: stat.accuracy ?? 0
  }));

  const timeSpentData = validStats.map((stat, index) => ({
    name: `${index + 1}`,
    value: stat.timeSpent ?? 0
  }));

  // const avgAccuracy = (() => {
  //   const filtered = validStats.filter((stat) => stat.accuracy != null);
  //   const total = filtered.reduce((acc, stat) => acc + stat.accuracy!, 0);
  //   return filtered.length > 0
  //     ? (total / filtered.length).toFixed(1) + "%"
  //     : "0%";
  // })();

  // const avgTimeSpent = (() => {
  //   const filtered = validStats.filter((stat) => stat.timeSpent != null);
  //   const total = filtered.reduce((acc, stat) => acc + stat.timeSpent!, 0);
  //   return filtered.length > 0
  //     ? Math.round(total / filtered.length) + "s"
  //     : "0s";
  // })();

  const accuracyChangeValue = (() => {
    const lastTwo = validStats.slice(-2);
    if (
      lastTwo.length === 2 &&
      lastTwo[0].accuracy != null &&
      lastTwo[1].accuracy != null
    ) {
      return lastTwo[1].accuracy - lastTwo[0].accuracy;
    }
    return 0;
  })();

  const timeChangeValue = (() => {
    const lastTwo = validStats.slice(-2);
    if (
      lastTwo.length === 2 &&
      lastTwo[0].timeSpent != null &&
      lastTwo[1].timeSpent != null
    ) {
      return lastTwo[1].timeSpent - lastTwo[0].timeSpent;
    }
    return 0;
  })();

  const accuracyChangeColor =
    accuracyChangeValue >= 0 ? "text-green-500" : "text-red-500";

  const timeChangeColor =
    timeChangeValue >= 0 ? "text-red-500" : "text-green-500";

  const latestValidStat = validStats[validStats.length - 1];

  return (
    <div className="w-full max-h-fit h-fit p-2 flex justify-center">
      <div className="w-full bg-white rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Your <span className="text-documind-primary">Statistics</span>
          </h1>
          <span className="text-base text-gray-500 bg-blue-100 px-3 py-1 rounded-full">
            {validStats.length} attempts —{" "}
            <span className="font-semibold text-documind-secondary">
              {latestValidStat?.correct}
            </span>{" "}
            correct out of{" "}
            <span className="font-semibold text-documind-secondary">
              {latestValidStat?.correct + latestValidStat?.incorrect}
            </span>
          </span>
        </div>

        <div className="space-y-6 mb-4">
          <StatisticCard
            title="Accuracy"
            value={
              latestValidStat?.accuracy
                ? `${latestValidStat.accuracy.toFixed(1)}%`
                : "0%"
            }
            change={
              accuracyChangeValue !== 0
                ? `${
                    accuracyChangeValue >= 0 ? "+" : ""
                  }${accuracyChangeValue.toFixed(1)}%`
                : "+0%"
            }
            changeColorClass={accuracyChangeColor}
            chartData={accuracyData}
            chartColor="#22c55e"
          />
          <StatisticCard
            title="Time Spent"
            value={
              latestValidStat?.timeSpent
                ? `${Math.round(latestValidStat.timeSpent)}s`
                : "0s"
            }
            change={
              timeChangeValue !== 0
                ? `${timeChangeValue >= 0 ? "+" : ""}${Math.round(
                    timeChangeValue
                  )}s`
                : "+0s"
            }
            changeColorClass={timeChangeColor}
            chartData={timeSpentData}
            chartColor="#ef4444"
          />
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
