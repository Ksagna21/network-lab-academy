import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SkillTracker from "@/components/SkillTracker";
import Leaderboard from "@/components/Leaderboard";
import { careerPaths } from "@/lib/lab-scenarios";
import useScrollReveal from "@/hooks/use-scroll-reveal";

const CareerPaths = () => {
  const header = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div ref={header.ref} style={header.style} className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Parcours de carrière</h1>
          <p className="text-muted-foreground text-lg">
            Choisissez votre spécialisation et suivez votre progression vers votre objectif professionnel.
          </p>
        </div>

        {/* Career Path Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {careerPaths.map((path) => (
            <div key={path.id} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow group">
              <span className="text-4xl block mb-4">{path.icon}</span>
              <h2 className="text-xl font-display font-bold mb-2">{path.title}</h2>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{path.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span>💰 {path.salaryRange}</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {path.demandLevel}
                </span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Link to="/courses">
                  Commencer ce parcours <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Skills */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">Compétences maîtrisées</h2>
            <SkillTracker />
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-6">Classement</h2>
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPaths;
