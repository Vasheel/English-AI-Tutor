
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AchievementBadgeProps = {
  icon: string;
  title: string;
  description: string;
  achieved: boolean;
  color: string;
};

const AchievementBadge = ({
  icon,
  title,
  description,
  achieved,
  color,
}: AchievementBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`achievement-badge w-20 h-20 rounded-full flex items-center justify-center ${achieved ? color : 'bg-gray-200'} ${achieved ? '' : 'opacity-50'} cursor-pointer`}>
            <div className="flex flex-col items-center">
              <span className="text-2xl" role="img" aria-label={title}>
                {icon}
              </span>
              {achieved && (
                <div className="absolute -bottom-1 -right-1 bg-edu-green text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <h4 className="font-bold">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
            {!achieved && <p className="text-xs mt-1 font-medium">Keep working to unlock!</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AchievementBadge;
