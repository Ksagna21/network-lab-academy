import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { CheckCircle, XCircle, Lightbulb, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabScenario, LabStep } from "@/lib/lab-scenarios";
import MentorMode from "./MentorMode";

interface LabEngineProps {
  scenario: LabScenario;
  onComplete?: (xpEarned: number) => void;
}

interface LabLine {
  type: "input" | "output" | "success" | "error" | "hint";
  content: string;
}

const LabEngine = ({ scenario, onComplete }: LabEngineProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lines, setLines] = useState<LabLine[]>([
    { type: "output", content: `🧪 Lab : ${scenario.title}` },
    { type: "output", content: `📋 ${scenario.description}\n` },
    { type: "output", content: `📌 Étape 1/${scenario.steps.length} : ${scenario.steps[0].instruction}\n` },
  ]);
  const [input, setInput] = useState("");
  const [xpEarned, setXpEarned] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const checkCommand = (cmd: string, step: LabStep): boolean => {
    const expected = Array.isArray(step.expectedCommand) ? step.expectedCommand : [step.expectedCommand];
    return expected.some((e) => cmd.trim().toLowerCase() === e.toLowerCase());
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || completed) return;

    const step = scenario.steps[currentStep];
    const newLines: LabLine[] = [{ type: "input", content: `❯ ${trimmed}` }];

    if (checkCommand(trimmed, step)) {
      newLines.push({ type: "success", content: step.successMessage });
      newLines.push({ type: "output", content: `  +${step.xpReward} XP\n` });
      const newXp = xpEarned + step.xpReward;
      setXpEarned(newXp);
      setAttempts(0);

      if (currentStep < scenario.steps.length - 1) {
        const next = currentStep + 1;
        setCurrentStep(next);
        newLines.push({
          type: "output",
          content: `📌 Étape ${next + 1}/${scenario.steps.length} : ${scenario.steps[next].instruction}\n`,
        });
      } else {
        setCompleted(true);
        newLines.push({ type: "output", content: `\n🎉 Lab terminé ! Total : ${newXp} XP` });
        onComplete?.(newXp);
      }
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      newLines.push({ type: "error", content: step.errorMessage });
      if (newAttempts >= 2) {
        newLines.push({ type: "hint", content: `💡 Indice : ${step.hint}` });
      }
    }

    setLines((prev) => [...prev, ...newLines]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const handleReset = () => {
    setCurrentStep(0);
    setXpEarned(0);
    setCompleted(false);
    setAttempts(0);
    setLines([
      { type: "output", content: `🧪 Lab : ${scenario.title}` },
      { type: "output", content: `📋 ${scenario.description}\n` },
      { type: "output", content: `📌 Étape 1/${scenario.steps.length} : ${scenario.steps[0].instruction}\n` },
    ]);
  };

  const mentorHints = scenario.steps[currentStep]
    ? [
        scenario.steps[currentStep].hint,
        `La commande attendue ressemble à : ${
          Array.isArray(scenario.steps[currentStep].expectedCommand)
            ? scenario.steps[currentStep].expectedCommand[0]
            : scenario.steps[currentStep].expectedCommand
        }`,
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / scenario.steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-primary tabular-nums">{xpEarned} XP</span>
      </div>

      {/* Steps overview */}
      <div className="flex gap-2 flex-wrap">
        {scenario.steps.map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
              i < currentStep
                ? "bg-primary text-primary-foreground"
                : i === currentStep
                ? "bg-accent text-accent-foreground ring-2 ring-accent/50"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
        ))}
      </div>

      {/* Terminal */}
      <div className="rounded-lg bg-terminal terminal-glow overflow-hidden" onClick={() => inputRef.current?.focus()}>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(0,0%,16%)] border-b border-[hsl(0,0%,20%)]">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[hsl(0,70%,55%)]" />
            <span className="w-3 h-3 rounded-full bg-[hsl(45,80%,55%)]" />
            <span className="w-3 h-3 rounded-full bg-[hsl(120,50%,45%)]" />
          </div>
          <span className="font-terminal text-xs text-[hsl(0,0%,55%)] ml-2">
            lab — {scenario.title}
          </span>
        </div>

        <div className="p-4 overflow-y-auto max-h-[350px] min-h-[200px] font-terminal text-sm leading-relaxed">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap ${
                line.type === "input" ? "text-terminal-prompt font-medium" :
                line.type === "success" ? "text-primary" :
                line.type === "error" ? "text-destructive" :
                line.type === "hint" ? "text-accent" :
                "text-terminal-fg"
              }`}
            >
              {line.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center px-4 py-3 border-t border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)]">
          {!completed ? (
            <>
              <span className="text-terminal-prompt font-terminal text-sm mr-2">❯</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-terminal-fg font-terminal text-sm outline-none caret-terminal-prompt"
                autoFocus
                spellCheck={false}
                placeholder="Tapez votre commande..."
              />
            </>
          ) : (
            <div className="flex items-center gap-2 text-primary font-terminal text-sm">
              <Trophy className="w-4 h-4" /> Lab complété !
            </div>
          )}
        </div>
      </div>

      {/* Mentor Mode */}
      {!completed && (
        <MentorMode
          currentStep={currentStep}
          totalSteps={scenario.steps.length}
          hints={mentorHints}
        />
      )}

      {completed && (
        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Recommencer le lab
          </Button>
        </div>
      )}
    </div>
  );
};

export default LabEngine;
