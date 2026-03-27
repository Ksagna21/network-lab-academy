import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Eye, Keyboard, Trophy, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import TerminalSimulator from "@/components/TerminalSimulator";
import LabEngine from "@/components/LabEngine";
import QuizEngine from "@/components/QuizEngine";
import { sampleLesson, labScenarios } from "@/lib/lab-scenarios";

const stepIcons = {
  explain: BookOpen,
  show: Eye,
  practice: Keyboard,
  challenge: Trophy,
  quiz: FileText,
};

const stepKeys = ["explain", "show", "practice", "challenge", "quiz"] as const;
type StepKey = (typeof stepKeys)[number];

const LessonView = () => {
  const [activeStep, setActiveStep] = useState<StepKey>("explain");
  const lesson = sampleLesson;
  const currentIdx = stepKeys.indexOf(activeStep);

  const scenario = labScenarios.find((s) => s.id === lesson.steps.challenge.scenarioId);

  const renderContent = () => {
    switch (activeStep) {
      case "explain":
      case "show":
        return (
          <div className="prose prose-sm max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-terminal prose-strong:text-foreground prose-table:text-sm">
            {renderMarkdown(lesson.steps[activeStep].content)}
          </div>
        );
      case "practice":
        return (
          <div className="space-y-6">
            <div className="prose prose-sm max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-terminal prose-strong:text-foreground">
              {renderMarkdown(lesson.steps.practice.content)}
            </div>
            <TerminalSimulator />
          </div>
        );
      case "challenge":
        if (!scenario) return <p>Scénario non trouvé.</p>;
        return <LabEngine scenario={scenario} />;
      case "quiz":
        return <QuizEngine questions={lesson.steps.quiz.questions} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Back */}
        <Link to="/course/reseaux-tcp-ip" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour au cours
        </Link>

        {/* Title */}
        <div className="mb-8">
          <span className="text-sm text-primary font-medium">Réseaux TCP/IP de A à Z</span>
          <h1 className="text-2xl md:text-3xl font-display font-bold mt-1">{lesson.title}</h1>
          <p className="text-muted-foreground mt-2">Suivez les 5 étapes pour maîtriser ce sujet.</p>
        </div>

        {/* Step Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {stepKeys.map((key, i) => {
            const Icon = stepIcons[key];
            const stepData = lesson.steps[key];
            const isActive = key === activeStep;
            const isPast = i < currentIdx;

            return (
              <button
                key={key}
                onClick={() => setActiveStep(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : isPast
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                {"title" in stepData ? stepData.title : `${i + 1}. ${key}`}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-w-4xl">
          {renderContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t max-w-4xl">
          <Button
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => setActiveStep(stepKeys[currentIdx - 1])}
          >
            ← Étape précédente
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIdx + 1} / {stepKeys.length}
          </span>
          <Button
            disabled={currentIdx === stepKeys.length - 1}
            onClick={() => setActiveStep(stepKeys[currentIdx + 1])}
            className="gap-2"
          >
            Étape suivante <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/** Simple markdown-to-JSX renderer (handles headers, code blocks, tables, lists, bold, inline code) */
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre key={key++} className="bg-terminal text-terminal-fg p-4 rounded-lg overflow-x-auto font-terminal text-sm my-4">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Table
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableRows.push(lines[i]);
        i++;
      }
      const headerCells = tableRows[0].split("|").filter(Boolean).map((c) => c.trim());
      const bodyRows = tableRows.slice(2); // skip header and separator
      elements.push(
        <div key={key++} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="border border-border px-3 py-2 bg-muted text-left font-semibold">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri}>
                  {row.split("|").filter(Boolean).map((cell, ci) => (
                    <td key={ci} className="border border-border px-3 py-2">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="text-lg font-display font-semibold mt-6 mb-2">{formatInline(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="text-xl font-display font-bold mt-8 mb-3">{formatInline(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} className="text-2xl font-display font-bold mt-8 mb-4">{formatInline(line.slice(2))}</h1>);
      i++;
      continue;
    }

    // List items
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc pl-6 my-3 space-y-1">
          {items.map((item, ii) => (
            <li key={ii} className="text-sm">{formatInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    elements.push(<p key={key++} className="text-sm leading-relaxed my-2">{formatInline(line)}</p>);
    i++;
  }

  return <>{elements}</>;
}

function formatInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  // Handle bold + inline code
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let k = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={k++}>{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(
        <code key={k++} className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-terminal text-xs">
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
}

export default LessonView;
