import { useState } from "react";
import { sampleCourses } from "@/lib/data";
import CourseCard from "@/components/CourseCard";
import Navbar from "@/components/Navbar";
import useScrollReveal from "@/hooks/use-scroll-reveal";

const categories = [
  { key: "all", label: "Tous" },
  { key: "networking", label: "🌐 Réseaux" },
  { key: "linux", label: "🐧 Linux" },
  { key: "telecom", label: "📡 Télécoms" },
];

const levels = [
  { key: "all", label: "Tous niveaux" },
  { key: "débutant", label: "Débutant" },
  { key: "intermédiaire", label: "Intermédiaire" },
  { key: "avancé", label: "Avancé" },
];

const Courses = () => {
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("all");
  const header = useScrollReveal();

  const filtered = sampleCourses.filter((c) => {
    if (category !== "all" && c.category !== category) return false;
    if (level !== "all" && c.level !== level) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div ref={header.ref} style={header.style} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Tous les cours</h1>
          <p className="text-muted-foreground text-lg">Choisissez votre parcours d'apprentissage</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] ${
                  category === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {levels.map((lev) => (
              <button
                key={lev.key}
                onClick={() => setLevel(lev.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.96] ${
                  level === lev.key
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {lev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course, i) => (
              <CourseCard key={course.id} course={course} delay={i * 60} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">Aucun cours trouvé</p>
            <p className="text-sm">Essayez de modifier les filtres</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
