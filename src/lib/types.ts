export interface Course {
  id: string;
  title: string;
  description: string;
  category: "networking" | "linux" | "telecom";
  level: "débutant" | "intermédiaire" | "avancé";
  modules: Module[];
  thumbnail: string;
  duration: string;
  lessonsCount: number;
  isFree: boolean;
  xpReward: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "lab" | "quiz";
  duration: string;
  completed?: boolean;
  content?: string;
}

export interface UserProgress {
  coursesEnrolled: number;
  coursesCompleted: number;
  totalXP: number;
  level: number;
  currentStreak: number;
  badges: Badge[];
  recentActivity: Activity[];
}

export interface Badge {
  id: string;
  title: string;
  icon: string;
  earnedAt?: string;
  description: string;
}

export interface Activity {
  id: string;
  type: "lesson_completed" | "badge_earned" | "quiz_passed";
  title: string;
  timestamp: string;
  xpEarned: number;
}
