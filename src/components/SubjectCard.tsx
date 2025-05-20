
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type SubjectCardProps = {
  title: string;
  icon: string;
  color: string;
  progress: number;
  route: string;
};

const SubjectCard = ({ title, icon, color, progress, route }: SubjectCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className={`h-2 ${color}`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} bg-opacity-20`}>
            <span className="text-2xl" role="img" aria-label={title}>
              {icon}
            </span>
          </div>
          <div className="relative w-14 h-14">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="stroke-current text-gray-200"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`stroke-current ${color.replace('bg-', 'text-')}`}
                strokeWidth="3"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="21" textAnchor="middle" className="text-xs font-semibold">
                {progress}%
              </text>
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => navigate(route)}
          className="w-full bg-edu-blue hover:bg-blue-400"
        >
          Continue Learning
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubjectCard;
