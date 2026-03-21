import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, BookOpen, PlayCircle, FileText, Terminal as TerminalIcon, HelpCircle, CheckCircle } from "lucide-react";
import { sampleCourses } from "@/lib/data";
import { Button } from "@/components/ui/button";
import TerminalSimulator from "@/components/TerminalSimulator";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import useScrollReveal from "@/hooks/use-scroll-reveal";

const lessonTypeIcons = {
  video: PlayCircle,
  text: FileText,
  lab: TerminalIcon,
  quiz: HelpCircle,
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const course = sampleCourses.find((c) => c.id === courseId);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const hero = useScrollReveal();

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 text-center">
          <p className="text-muted-foreground text-lg">Cours introuvable</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/courses">Retour aux cours</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalCompleted = course.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0
  );
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const progress = Math.round((totalCompleted / totalLessons) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-20 pb-16">
        <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour aux cours
        </Link>

        {/* Header */}
        <div ref={hero.ref} style={hero.style} className="mb-10">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">{course.title}</h1>
              <p className="text-muted-foreground text-lg mb-4">{course.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {totalLessons} leçons</span>
                <span className="text-accent font-semibold">+{course.xpReward} XP</span>
              </div>

              {/* Progress bar */}
              <div className="max-w-md">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full xp-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setShowTerminal(!showTerminal)}
                variant={showTerminal ? "default" : "outline"}
                className={showTerminal ? "bg-primary text-primary-foreground" : ""}
              >
                <TerminalIcon className="w-4 h-4 mr-2" />
                {showTerminal ? "Masquer le terminal" : "Ouvrir le terminal"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Modules sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {course.modules.map((mod) => (
              <div key={mod.id} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-5 py-3 bg-muted/50 font-display font-semibold text-sm">
                  {mod.title}
                </div>
                <div className="divide-y divide-border">
                  {mod.lessons.map((lesson) => {
                    const Icon = lessonTypeIcons[lesson.type];
                    const isActive = activeLesson === lesson.id;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson.id)}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-muted/50 active:scale-[0.99] ${
                          isActive ? "bg-primary/5 text-primary" : ""
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Content area */}
          <div className="lg:col-span-3">
            {showTerminal ? (
              <TerminalSimulator />
            ) : activeLesson ? (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-xl font-display font-semibold mb-4">
                  {course.modules.flatMap((m) => m.lessons).find((l) => l.id === activeLesson)?.title}
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>
                    Le contenu de cette leçon sera affiché ici. Il peut inclure du texte formaté,
                    des diagrammes, des vidéos et des exercices interactifs.
                  </p>
                  <p className="mt-4">
                    Utilisez le terminal intégré pour pratiquer les commandes vues dans cette leçon.
                  </p>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]">
                    Marquer comme terminé
                  </Button>
                  <Button variant="outline" onClick={() => setShowTerminal(true)}>
                    <TerminalIcon className="w-4 h-4 mr-2" />
                    Pratiquer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-1">Sélectionnez une leçon</p>
                <p className="text-sm">Choisissez une leçon dans le menu pour commencer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
