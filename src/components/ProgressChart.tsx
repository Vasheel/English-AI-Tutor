
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
const initialData = [
  { name: "Week 1", math: 65, science: 40, reading: 55 },
  { name: "Week 2", math: 70, science: 45, reading: 60 },
  { name: "Week 3", math: 75, science: 55, reading: 68 },
  { name: "Week 4", math: 80, science: 60, reading: 72 },
];

const ProgressChart = () => {
  const [data, setData] = useState(initialData);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Add animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card className={`overflow-hidden transition-all duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-bold">Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[300px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "white", 
                  borderRadius: "0.5rem",
                  boxShadow: "0px 4px 15px rgba(0,0,0,0.1)",
                  border: "none"
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="math"
                stroke="#9b87f5"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                animationDuration={2000}
              />
              <Line
                type="monotone"
                dataKey="science"
                stroke="#4FD1C5"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                animationDuration={2000}
                animationBegin={300}
              />
              <Line
                type="monotone"
                dataKey="reading"
                stroke="#F6E05E"
                strokeWidth={3}
                activeDot={{ r: 8 }}
                animationDuration={2000}
                animationBegin={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
