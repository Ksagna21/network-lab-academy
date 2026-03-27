import { careerPaths } from "@/lib/lab-scenarios";

const SkillTracker = () => {
  // Simulated skill levels for demo
  const simulatedSkills: Record<string, number> = {
    "TCP/IP": 75,
    "Routage (OSPF/BGP)": 40,
    "Switching (VLAN)": 20,
    "Sécurité réseau": 10,
    "Troubleshooting": 55,
    "WiFi": 30,
    "Linux CLI": 85,
    "Administration serveur": 60,
    "Scripting Bash": 45,
    "Docker/Containers": 15,
    "Monitoring": 35,
    "Sécurité système": 25,
    "Protocole SIP": 50,
    "Asterisk/FreePBX": 40,
    "RTP/Codecs": 20,
    "Troubleshooting VoIP": 30,
    "QoS": 15,
    "Intégration télécom": 10,
  };

  return (
    <div className="space-y-6">
      {careerPaths.map((path) => (
        <div key={path.id} className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{path.icon}</span>
            <div>
              <h3 className="font-display font-semibold">{path.title}</h3>
              <p className="text-xs text-muted-foreground">{path.description}</p>
            </div>
          </div>

          <div className="space-y-3">
            {path.skills.map((skill) => {
              const level = simulatedSkills[skill.name] || 0;
              const label = level >= 80 ? "Expert" : level >= 50 ? "Intermédiaire" : level >= 20 ? "Débutant" : "Non commencé";
              const color = level >= 80 ? "bg-primary" : level >= 50 ? "bg-accent" : level >= 20 ? "bg-badge-silver" : "bg-secondary";

              return (
                <div key={skill.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-xs text-muted-foreground">{label} — {level}%</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{ width: `${level}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>💰 Salaire : {path.salaryRange}</span>
            <span>📈 Demande : {path.demandLevel}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkillTracker;
