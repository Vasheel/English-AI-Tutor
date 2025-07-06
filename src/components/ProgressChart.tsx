import { useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Sample data
export interface ProgressState {
  name: string;
  math: number;
  science: number;
  reading: number;
  english?: number;
}

const initialData: ProgressState[] = [
  { name: "Week 1", math: 65, science: 40, reading: 55 },
  { name: "Week 2", math: 70, science: 45, reading: 60 },
  { name: "Week 3", math: 75, science: 55, reading: 68 },
  { name: "Week 4", math: 80, science: 60, reading: 72 },
];

interface ProgressChartProps {
  data: ProgressState[];
  selectedSubject: 'reading' | 'english' | 'math' | 'science';
  viewType: 'weekly' | 'cumulative';
}

export default function ProgressChart({ data, selectedSubject, viewType }: ProgressChartProps) {
  const [animate, setAnimate] = useState(false);

  // Generate ghost data for future weeks
  const generateGhostData = (weeksAhead: number) => {
    const lastWeek = parseInt(data[data.length - 1].name.split(' ')[1]);
    return Array.from({ length: weeksAhead }, (_, i) => ({
      name: `Week ${lastWeek + i + 1}`,
      [selectedSubject]: 0,
    }));
  };

  // Calculate cumulative data if needed
  const cumulativeData = data.reduce((acc, current, index) => {
    const cumulative = acc[index - 1] || { ...current };
    cumulative[selectedSubject] = (cumulative[selectedSubject] || 0) + current[selectedSubject];
    return [...acc, cumulative];
  }, [] as ProgressState[]);

  // Combine real and ghost data
  const chartData = viewType === 'cumulative' ? cumulativeData : data;
  const extendedData = [...chartData, ...generateGhostData(4)]; // Show 4 future weeks

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className={`overflow-hidden transition-all duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-bold">{viewType === 'cumulative' ? 'Cumulative Progress' : 'Weekly Progress'}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[300px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={extendedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={selectedSubject}
                stroke={selectedSubject === 'reading' ? '#2563eb' : '#10b981'}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
