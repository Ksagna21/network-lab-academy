import { useState } from "react";
import { Sparkles, TrendingUp, ArrowRight, RefreshCw, Lightbulb } from "lucide-react";
import useScrollReveal from "@/hooks/use-scroll-reveal";

interface TechSuggestion {
  id: string;
  title: string;
  category: "networking" | "linux" | "telecom";
  reason: string;
  trending: boolean;
  relevance: number;
}

const mockSuggestions: TechSuggestion[] = [
  {
    id: "s1",
    title: "SD-WAN & SASE Architecture",
    category: "networking",
    reason: "En forte croissance — 34% d'adoption en entreprise cette année",
    trending: true,
    relevance: 96,
  },
  {
    id: "s2",
    title: "Kubernetes & Conteneurisation réseau",
    category: "linux",
    reason: "Compétence demandée dans 78% des offres DevOps/réseau",
    trending: true,
    relevance: 93,
  },
  {
    id: "s3",
    title: "5G Core & Network Slicing",
    category: "telecom",
    reason: "Déploiement massif en Afrique prévu pour 2025-2027",
    trending: true,
    relevance: 91,
  },
  {
    id: "s4",
    title: "WiFi 7 (802.11be)",
    category: "networking",
    reason: "Nouveau standard — premiers déploiements en cours",
    trending: false,
    relevance: 85,
  },
  {
    id: "s5",
    title: "eBPF pour l'observabilité réseau",
    category: "linux",
    reason: "Technologie montante pour le monitoring système avancé",
    trending: false,
    relevance: 82,
  },
];

const mockUpdates = [
  { id: "u1", course: "Réseaux TCP/IP de A à Z", update: "Nouveau module : IPv6 avancé et transition dual-stack", urgency: "recommandé" },
  { id: "u2", course: "Les Fondamentaux de Linux", update: "Mise à jour : commandes systemd remplacent init.d", urgency: "important" },
  { id: "u3", course: "VoIP et IPBX avec Asterisk", update: "Ajout : WebRTC et communications unifiées", urgency: "nouveau" },
];

const categoryColors: Record<string, string> = {
  networking: "bg-primary/10 text-primary",
  linux: "bg-orange-500/10 text-orange-600",
  telecom: "bg-accent/10 text-accent",
};

const categoryLabels: Record<string, string> = {
  networking: "🌐 Réseaux",
  linux: "🐧 Linux",
  telecom: "📡 Télécoms",
};

const AISuggestions = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const reveal = useScrollReveal({ delay: 100 });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div ref={reveal.ref} style={reveal.style} className="space-y-6">
      {/* New tech suggestions */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Suggestions IA — Nouvelles technologies
          </h2>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-secondary transition-colors active:scale-95"
            title="Actualiser les suggestions"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-3">
          {mockSuggestions.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-4 p-4 rounded-xl border bg-background hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{s.title}</h3>
                  {s.trending && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                      <TrendingUp className="w-3 h-3" /> Tendance
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{s.reason}</p>
                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${categoryColors[s.category]}`}>
                  {categoryLabels[s.category]}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-display font-bold tabular-nums text-primary">{s.relevance}%</div>
                <div className="text-xs text-muted-foreground">pertinence</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content update suggestions */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          Mises à jour recommandées par l'IA
        </h2>
        <div className="space-y-3">
          {mockUpdates.map((u) => (
            <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl border bg-background">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{u.course}</p>
                <p className="text-xs text-muted-foreground mt-1">{u.update}</p>
              </div>
              <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                u.urgency === "important" ? "bg-orange-500/10 text-orange-600" :
                u.urgency === "nouveau" ? "bg-primary/10 text-primary" :
                "bg-secondary text-secondary-foreground"
              }`}>
                {u.urgency}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AISuggestions;
