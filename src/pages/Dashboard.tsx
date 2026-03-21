import { Link } from "react-router-dom";
import { Award, Flame, BookOpen, Zap, TrendingUp, Clock } from "lucide-react";
import { sampleUserProgress, sampleCourses } from "@/lib/data";
import Navbar from "@/components/Navbar";
import AISuggestions from "@/components/AISuggestions";
import AILearningPath from "@/components/AILearningPath";
import useScrollReveal from "@/hooks/use-scroll-reveal";

const xpForLevel = (level: number) => level * 300;

const Dashboard = () => {
  const p = sampleUserProgress;
  const header = useScrollReveal();
  const statsSection = useScrollReveal({ delay: 100 });
  const progressSection = useScrollReveal({ delay: 200 });
  const badgesSection = useScrollReveal({ delay: 100 });
  const activitySection = useScrollReveal({ delay: 200 });

  const xpInLevel = p.totalXP % xpForLevel(p.level);
  const xpNeeded = xpForLevel(p.level);
  const xpPercent = Math.round((xpInLevel / xpNeeded) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div ref={header.ref} style={header.style} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-1">Tableau de bord</h1>
          <p className="text-muted-foreground text-lg">Bienvenue, Étudiant ! Continuez votre progression.</p>
        </div>

        {/* Stats grid */}
        <div ref={statsSection.ref} style={statsSection.style} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Zap, label: "XP Total", value: p.totalXP.toLocaleString(), color: "text-accent" },
            { icon: TrendingUp, label: "Niveau", value: p.level, color: "text-primary" },
            { icon: Flame, label: "Série", value: `${p.currentStreak} jours`, color: "text-orange-500" },
            { icon: BookOpen, label: "Cours terminés", value: `${p.coursesCompleted}/${p.coursesEnrolled}`, color: "text-primary" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="text-2xl font-display font-bold tabular-nums">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* XP Progress */}
        <div ref={progressSection.ref} style={progressSection.style} className="rounded-xl border bg-card p-6 mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">Progression de niveau</h2>
            <span className="text-sm text-muted-foreground">
              Niveau {p.level} → {p.level + 1}
            </span>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full xp-fill"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {xpInLevel} / {xpNeeded} XP — encore {xpNeeded - xpInLevel} XP pour le prochain niveau
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Badges */}
          <div ref={badgesSection.ref} style={badgesSection.style}>
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              Badges
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {p.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    badge.earnedAt
                      ? "bg-card shadow-sm badge-pop"
                      : "bg-muted/50 opacity-50"
                  }`}
                >
                  <span className="text-3xl block mb-2">{badge.icon}</span>
                  <h3 className="text-sm font-semibold">{badge.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  {badge.earnedAt && (
                    <p className="text-xs text-primary mt-2 font-medium">✓ Obtenu</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div ref={activitySection.ref} style={activitySection.style}>
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Activité récente
            </h2>
            <div className="space-y-3">
              {p.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    activity.type === "badge_earned" ? "bg-accent/10" :
                    activity.type === "quiz_passed" ? "bg-primary/10" :
                    "bg-muted"
                  }`}>
                    {activity.type === "badge_earned" ? "🏅" :
                     activity.type === "quiz_passed" ? "✅" : "📖"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                  <span className="text-sm font-semibold text-accent">+{activity.xpEarned} XP</span>
                </div>
              ))}
            </div>

            {/* Continue learning */}
            <div className="mt-6 rounded-xl border bg-primary/5 p-5">
              <h3 className="font-display font-semibold mb-2">Continuer à apprendre</h3>
              <p className="text-sm text-muted-foreground mb-3">Reprenez là où vous vous êtes arrêté</p>
              <Link
                to="/course/reseaux-tcp-ip"
                className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Réseaux TCP/IP de A à Z →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
