import { useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, Signal, Terminal as TerminalIcon, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import LabEngine from "@/components/LabEngine";
import { labScenarios, LabScenario } from "@/lib/lab-scenarios";
import useScrollReveal from "@/hooks/use-scroll-reveal";

const categoryIcons = {
  networking: Signal,
  linux: TerminalIcon,
  telecom: Phone,
};

const difficultyColors = {
  "débutant": "bg-primary/10 text-primary",
  "intermédiaire": "bg-accent/10 text-accent",
  "avancé": "bg-destructive/10 text-destructive",
};

const Labs = () => {
  const [activeScenario, setActiveScenario] = useState<LabScenario | null>(null);
  const header = useScrollReveal();

  if (activeScenario) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-16 max-w-4xl">
          <button
            onClick={() => setActiveScenario(null)}
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 transition-colors"
          >
            ← Retour aux labs
          </button>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{activeScenario.title}</h1>
          <p className="text-muted-foreground mb-6">{activeScenario.description}</p>
          <LabEngine scenario={activeScenario} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div ref={header.ref} style={header.style} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-display font-bold">Labs interactifs</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Pratiquez dans des scénarios réels avec validation automatique et indices.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {labScenarios.map((scenario) => {
            const Icon = categoryIcons[scenario.category];
            return (
              <div key={scenario.id} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${difficultyColors[scenario.difficulty]}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{scenario.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{scenario.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{scenario.totalXP} XP</span> · {scenario.steps.length} étapes
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveScenario(scenario)}
                    className="group-hover:bg-primary group-hover:text-primary-foreground"
                    variant="outline"
                  >
                    Lancer le lab
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Labs;
