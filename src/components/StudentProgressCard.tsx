
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressData {
  subject: string;
  progress: number;
  color: string;
  exercisesCompleted: number;
  quizzesCompleted: number;
}

interface StudentProgressCardProps {
  data: ProgressData[];
}

const StudentProgressCard = ({ data }: StudentProgressCardProps) => {
  const totalProgress = data.reduce((sum, item) => sum + item.progress, 0) / data.length;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <h3 className="font-bold text-lg">Progress Overview</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall Progress</span>
          <span className="font-medium">{Math.round(totalProgress)}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((subject) => (
            <div key={subject.subject} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">{subject.subject}</span>
                <span className="text-sm">{subject.progress}%</span>
              </div>
              <Progress 
                value={subject.progress} 
                className={`h-2 ${subject.color}`} 
              />
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Exercises: {subject.exercisesCompleted}</span>
                <span>Quizzes: {subject.quizzesCompleted}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProgressCard;
