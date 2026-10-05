import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Network } from "lucide-react";
import Navbar from "@/components/Navbar";
import { ciscoLabs } from "@/labs";
import { CATEGORY_LABEL, DIFFICULTY_STYLE } from "@/labs/labels";
import { loadProgress } from "@/lib/cisco-progress";

const CiscoLabs = () => {
  const [category, setCategory] = useState<string>("all");
  const progress = useMemo(loadProgress, []);
  const categories = ["all", ...Array.from(new Set(ciscoLabs.map((l) => l.category)))];
  const shown = ciscoLabs.filter((l) => category === "all" || l.category === category);
  const doneCount = ciscoLabs.filter((l) => progress[l.id]?.completedAt).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-16">
        <header className="mb-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <Network className="w-8 h-8 text-primary" aria-hidden />
            <h1 className="text-3xl md:text-4xl font-display font-bold">Labs Cisco CLI</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Configurez de vrais équipements simulés en ligne de commande. Chaque lab vérifie l'état du réseau, pas ce que vous avez tapé : plusieurs
            solutions sont possibles.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {doneCount} / {ciscoLabs.length} labs terminés
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtrer par catégorie">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                category === c ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "all" ? "Tous" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {shown.map((lab) => {
            const p = progress[lab.id];
            return (
              <Link
                key={lab.id}
                to={`/cisco-labs/${lab.id}`}
                className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/40 transition-all flex flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{CATEGORY_LABEL[lab.category]}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${DIFFICULTY_STYLE[lab.difficulty]}`}>{lab.difficulty}</span>
                </div>
                <h2 className="text-lg font-display font-semibold mb-2">{lab.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{lab.description}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4" aria-hidden /> {lab.estimatedMinutes} min ·{" "}
                    <span className="font-medium text-primary">{lab.xpReward} XP</span>
                  </span>
                  {p?.completedAt ? (
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      <CheckCircle2 className="w-4 h-4" aria-hidden /> Terminé
                    </span>
                  ) : p ? (
                    <span>
                      {p.bestObjectives} / {lab.objectives.length} objectifs
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default CiscoLabs;
