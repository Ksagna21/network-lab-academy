import { Compass, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import useScrollReveal from "@/hooks/use-scroll-reveal";

const recommendedPath = [
  {
    id: "linux-fondamentaux",
    title: "Les Fondamentaux de Linux",
    reason: "Base essentielle — 85% complété, finissez-le !",
    progress: 85,
    priority: "continuer",
  },
  {
    id: "reseaux-tcp-ip",
    title: "Réseaux TCP/IP de A à Z",
    reason: "Complète vos compétences Linux avec le réseau",
    progress: 42,
    priority: "en cours",
  },
  {
    id: "linux-serveurs",
    title: "Linux : Administration de Serveurs",
    reason: "Recommandé après les fondamentaux Linux",
    progress: 0,
    priority: "suivant",
  },
  {
    id: "voip-ipbx",
    title: "VoIP et IPBX avec Asterisk",
    reason: "Combine vos connaissances réseau + Linux",
    progress: 0,
    priority: "futur",
  },
];

const priorityStyles: Record<string, string> = {
  continuer: "bg-accent/10 text-accent",
  "en cours": "bg-primary/10 text-primary",
  suivant: "bg-orange-500/10 text-orange-600",
  futur: "bg-secondary text-muted-foreground",
};

const AILearningPath = () => {
  const reveal = useScrollReveal({ delay: 150 });

  return (
    <div ref={reveal.ref} style={reveal.style} className="rounded-xl border bg-card p-6">
      <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
        <Compass className="w-5 h-5 text-primary" />
        Parcours personnalisé IA
      </h2>
      <p className="text-sm text-muted-foreground mb-5 flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5" />
        Basé sur votre niveau, vos objectifs et les tendances du marché
      </p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />

        <div className="space-y-4">
          {recommendedPath.map((item, i) => (
            <Link
              key={item.id}
              to={`/course/${item.id}`}
              className="flex items-center gap-4 group relative pl-9"
            >
              {/* Dot on timeline */}
              <div className={`absolute left-2 w-[14px] h-[14px] rounded-full border-2 ${
                item.progress > 0
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 bg-background"
              }`}>
                {item.progress > 0 && (
                  <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                )}
              </div>

              <div className="flex-1 p-3 rounded-xl border bg-background group-hover:shadow-md transition-shadow min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{item.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[item.priority]}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.reason}</p>
                {item.progress > 0 && (
                  <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AILearningPath;
