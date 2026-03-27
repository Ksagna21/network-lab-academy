import { useState } from "react";
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizEngineProps {
  questions: QuizQuestion[];
  onComplete?: (score: number, total: number) => void;
}

const QuizEngine = ({ questions, onComplete }: QuizEngineProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  const isCorrect = selected === q?.correct;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
      onComplete?.(score + (isCorrect ? 0 : 0), questions.length);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">{passed ? "🎉" : "📚"}</div>
        <h3 className="text-2xl font-display font-bold mb-2">
          {passed ? "Quiz réussi !" : "Continuez à apprendre !"}
        </h3>
        <p className="text-lg text-muted-foreground mb-2">
          Score : <span className="font-bold text-foreground">{score}/{questions.length}</span> ({pct}%)
        </p>
        {passed && (
          <p className="text-primary font-semibold mb-6">+50 XP gagnés !</p>
        )}
        {!passed && (
          <p className="text-muted-foreground mb-6">Il faut 70% pour valider. Révisez et réessayez !</p>
        )}
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Recommencer
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          Question {currentQ + 1} / {questions.length}
        </span>
        <span className="text-sm font-medium text-primary">{score} correct{score > 1 ? "es" : "e"}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="text-lg font-display font-semibold mb-5">{q.question}</h3>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {q.options.map((opt, i) => {
          let classes = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ";
          if (!showResult) {
            classes += "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer";
          } else if (i === q.correct) {
            classes += "border-primary bg-primary/10 text-foreground";
          } else if (i === selected) {
            classes += "border-destructive bg-destructive/10 text-foreground";
          } else {
            classes += "border-border opacity-50";
          }

          return (
            <button key={i} onClick={() => handleSelect(i)} className={classes} disabled={showResult}>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-semibold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm">{opt}</span>
                {showResult && i === q.correct && <CheckCircle className="w-5 h-5 text-primary ml-auto shrink-0" />}
                {showResult && i === selected && i !== q.correct && <XCircle className="w-5 h-5 text-destructive ml-auto shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showResult && (
        <div className={`p-4 rounded-xl mb-6 ${isCorrect ? "bg-primary/10 border border-primary/20" : "bg-destructive/10 border border-destructive/20"}`}>
          <p className="text-sm font-medium mb-1">{isCorrect ? "✅ Correct !" : "❌ Incorrect"}</p>
          <p className="text-sm text-muted-foreground">{q.explanation}</p>
        </div>
      )}

      {showResult && (
        <Button onClick={handleNext} className="gap-2">
          {currentQ < questions.length - 1 ? "Question suivante" : "Voir le résultat"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default QuizEngine;
