import { Link, useLocation } from "react-router-dom";
import { Terminal, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut, isAdmin, isInstructor } = useAuth();

  const links = [
    { to: "/", label: "Accueil" },
    { to: "/courses", label: "Cours" },
    { to: "/labs", label: "Labs" },
    { to: "/career", label: "Carrière" },
    { to: "/dashboard", label: "Tableau de bord" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-lg">NetAcademy</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {(isAdmin || isInstructor) && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin" className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                {profile?.full_name?.split(" ")[0] || "User"}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all">
                <Link to="/auth">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background py-4 px-4 animate-fade-in-up">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {user && (isAdmin || isInstructor) && (
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-primary">
              Admin Panel
            </Link>
          )}
          <div className="flex gap-2 mt-4">
            {user ? (
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { signOut(); setMobileOpen(false); }}>
                Déconnexion
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Connexion</Link>
                </Button>
                <Button asChild size="sm" className="flex-1 bg-primary text-primary-foreground">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>S'inscrire</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
