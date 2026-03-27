import { useState } from "react";
import { Lightbulb, MessageCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MentorModeProps {
  currentStep: number;
  totalSteps: number;
  hints: string[];
  encouragements?: string[];
}

const defaultEncouragements = [
  "Vous progressez bien ! Continuez comme ça 💪",
  "Chaque erreur est une leçon. N'abandonnez pas !",
  "Les meilleurs ingénieurs ont tous commencé comme vous 🌟",
  "Prenez votre temps, la compréhension est plus importante que la vitesse.",
  "Vous êtes plus proche du but que vous ne le pensez !",
];

const MentorMode = ({ currentStep, totalSteps, hints, encouragements = defaultEncouragements }: MentorModeProps) => {
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [showMentor, setShowMentor] = useState(true);

  const encouragement = encouragements[currentStep % encouragements.length];

  const revealNextHint = () => {
    if (!showHint) {
      setShowHint(true);
      setHintLevel(0);
    } else if (hintLevel < hints.length - 1) {
      setHintLevel((l) => l + 1);
    }
  };

  return (
    <div className="rounded-xl border-2 border-accent/30 bg-accent/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setShowMentor(!showMentor)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-semibold text-sm">Mode Mentor</h3>
            <p className="text-xs text-muted-foreground">Votre guide personnel</p>
          </div>
        </div>
        {showMentor ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {showMentor && (
        <div className="px-4 pb-4 space-y-4">
          {/* Encouragement */}
          <div className="flex gap-3 items-start">
            <MessageCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground italic">{encouragement}</p>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Étape {currentStep + 1} / {totalSteps}</span>
              <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Hint system */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={revealNextHint}
              className="gap-2 text-xs border-accent/30 hover:bg-accent/10"
              disabled={showHint && hintLevel >= hints.length - 1}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              {!showHint ? "Besoin d'un indice ?" : hintLevel < hints.length - 1 ? "Indice suivant" : "Pas d'autre indice"}
            </Button>

            {showHint && (
              <div className="mt-3 space-y-2">
                {hints.slice(0, hintLevel + 1).map((hint, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-lg bg-accent/10">
                    <span className="text-xs font-bold text-accent shrink-0">💡 {i + 1}.</span>
                    <p className="text-sm text-foreground">{hint}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorMode;
