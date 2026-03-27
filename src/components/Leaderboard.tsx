import { Trophy, Flame, TrendingUp } from "lucide-react";
import { leaderboardData, gamificationLevels } from "@/lib/lab-scenarios";

const Leaderboard = () => {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-5 border-b flex items-center gap-3">
        <Trophy className="w-5 h-5 text-accent" />
        <h2 className="font-display font-semibold text-lg">Classement</h2>
      </div>

      <div className="divide-y">
        {leaderboardData.map((user) => {
          const levelInfo = [...gamificationLevels].reverse().find((l) => user.xp >= l.xpRequired);
          return (
            <div
              key={user.rank}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                user.isCurrentUser ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/50"
              }`}
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                user.rank === 1 ? "bg-accent/20 text-accent" :
                user.rank === 2 ? "bg-badge-silver/20 text-badge-silver" :
                user.rank === 3 ? "bg-badge-bronze/20 text-badge-bronze" :
                "bg-secondary text-muted-foreground"
              }`}>
                {user.rank <= 3 ? ["🥇", "🥈", "🥉"][user.rank - 1] : user.rank}
              </div>

              {/* Avatar + name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{user.avatar}</span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${user.isCurrentUser ? "text-primary" : ""}`}>
                    {user.name} {user.isCurrentUser && "(vous)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {levelInfo?.icon} {levelInfo?.title}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  {user.streak}j
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{user.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
