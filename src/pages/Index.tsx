import { Link } from "react-router-dom";
import { BookOpen, Terminal, Wifi, ArrowRight, Zap, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import TerminalSimulator from "@/components/TerminalSimulator";
import CourseCard from "@/components/CourseCard";
import { sampleCourses } from "@/lib/data";
import useScrollReveal from "@/hooks/use-scroll-reveal";
import Navbar from "@/components/Navbar";

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any; title: string; description: string; delay: number }) => {
  const { ref, style } = useScrollReveal({ delay });
  return (
    <div ref={ref} style={style} className="group p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-display font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const StatItem = ({ value, label, delay }: { value: string; label: string; delay: number }) => {
  const { ref, style } = useScrollReveal({ delay });
  return (
    <div ref={ref} style={style} className="text-center">
      <div className="text-3xl font-display font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const Index = () => {
  const hero = useScrollReveal();
  const terminalSection = useScrollReveal();
  const coursesHeader = useScrollReveal();
  const ctaSection = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div ref={hero.ref} style={hero.style} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Apprenez en pratiquant
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] tracking-tight mb-6">
              Maîtrisez les réseaux, Linux et les télécoms
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Des cours interactifs avec des labs pratiques, un terminal intégré et des projets concrets. Du débutant à l'expert.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-150 px-8">
                <Link to="/courses">
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="active:scale-[0.97] transition-all duration-150">
                <Link to="/courses">Voir les cours</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 md:gap-20 mt-16">
            <StatItem value="2,400+" label="Étudiants" delay={100} />
            <StatItem value="45+" label="Labs pratiques" delay={200} />
            <StatItem value="12" label="Cours" delay={300} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Terminal}
              title="Terminal intégré"
              description="Pratiquez Linux et la configuration réseau directement dans votre navigateur. Pas besoin d'installer quoi que ce soit."
              delay={0}
            />
            <FeatureCard
              icon={BookOpen}
              title="Cours structurés"
              description="Progressez du débutant à l'expert avec des modules clairs, des vidéos et des quiz pour valider vos acquis."
              delay={80}
            />
            <FeatureCard
              icon={Wifi}
              title="Scénarios réels"
              description="Configurez OSPF, dépannez des problèmes SIP, déployez un IPBX — comme dans un vrai environnement pro."
              delay={160}
            />
          </div>
        </div>
      </section>

      {/* Terminal Demo */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div ref={terminalSection.ref} style={terminalSection.style} className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
                Essayez le terminal
              </h2>
              <p className="text-muted-foreground text-lg">
                Tapez <code className="font-terminal text-primary bg-primary/10 px-1.5 py-0.5 rounded text-sm">help</code> pour commencer
              </p>
            </div>
            <TerminalSimulator />
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div ref={coursesHeader.ref} style={coursesHeader.style} className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">Cours populaires</h2>
              <p className="text-muted-foreground">Commencez votre parcours d'apprentissage</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex text-primary hover:text-primary/80">
              <Link to="/courses">Voir tous <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleCourses.slice(0, 3).map((course, i) => (
              <CourseCard key={course.id} course={course} delay={i * 80} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Button asChild variant="outline">
              <Link to="/courses">Voir tous les cours</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Gamification */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Award}
              title="Badges et XP"
              description="Gagnez des points d'expérience, débloquez des badges et montez en niveau. L'apprentissage devient un jeu."
              delay={0}
            />
            <FeatureCard
              icon={Users}
              title="Communauté"
              description="Échangez avec d'autres apprenants, posez vos questions et partagez vos projets dans les forums."
              delay={80}
            />
            <FeatureCard
              icon={Award}
              title="Certificats"
              description="Obtenez un certificat à la fin de chaque parcours pour valoriser vos compétences auprès des recruteurs."
              delay={160}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div ref={ctaSection.ref} style={ctaSection.style} className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Prêt à apprendre ?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Rejoignez des milliers d'apprenants qui développent leurs compétences en réseaux, Linux et télécoms.
            </p>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] transition-all duration-150 px-8 font-semibold">
              <Link to="/courses">
                Commencer maintenant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-lg">NetAcademy</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/courses" className="hover:text-foreground transition-colors">Cours</Link>
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Tableau de bord</Link>
              <span className="cursor-default">À propos</span>
              <span className="cursor-default">Contact</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 NetAcademy</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
