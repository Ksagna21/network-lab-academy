import { Link } from "react-router-dom";
import { Clock, BookOpen, Lock } from "lucide-react";
import { Course } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import useScrollReveal from "@/hooks/use-scroll-reveal";

const levelColors = {
  "débutant": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "intermédiaire": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "avancé": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const categoryIcons = {
  networking: "🌐",
  linux: "🐧",
  telecom: "📡",
};

const CourseCard = ({ course, delay = 0 }: { course: Course; delay?: number }) => {
  const { ref, style } = useScrollReveal({ delay });

  return (
    <div ref={ref} style={style}>
      <Link
        to={`/course/${course.id}`}
        className="group block rounded-xl border bg-card shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        {/* Thumbnail area */}
        <div className="relative h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <span className="text-5xl">{categoryIcons[course.category]}</span>
          {!course.isFree && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent text-accent-foreground text-xs font-semibold px-2 py-1 rounded-full">
              <Lock className="w-3 h-3" />
              Premium
            </div>
          )}
          {course.isFree && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
              Gratuit
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelColors[course.level]}`}>
              {course.level}
            </span>
          </div>
          <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors leading-snug">
            {course.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {course.lessonsCount} leçons
            </span>
            <span className="ml-auto text-accent font-semibold">+{course.xpReward} XP</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CourseCard;
