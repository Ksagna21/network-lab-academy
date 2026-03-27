export interface LabStep {
  instruction: string;
  expectedCommand: string | string[];
  hint: string;
  successMessage: string;
  errorMessage: string;
  xpReward: number;
}

export interface LabScenario {
  id: string;
  title: string;
  description: string;
  category: "linux" | "networking" | "telecom";
  difficulty: "débutant" | "intermédiaire" | "avancé";
  steps: LabStep[];
  totalXP: number;
}

export const labScenarios: LabScenario[] = [
  {
    id: "ip-addressing",
    title: "Configurer l'adressage IP",
    description: "Apprenez à configurer une interface réseau avec une adresse IP statique.",
    category: "networking",
    difficulty: "débutant",
    totalXP: 150,
    steps: [
      {
        instruction: "Affichez les interfaces réseau actuelles avec la commande `ip addr`.",
        expectedCommand: ["ip addr", "ip a", "ifconfig"],
        hint: "Utilisez la commande `ip addr` ou `ip a` pour voir toutes les interfaces.",
        successMessage: "✅ Parfait ! Vous pouvez voir les interfaces eth0 et lo.",
        errorMessage: "❌ Ce n'est pas la bonne commande. Essayez `ip addr`.",
        xpReward: 20,
      },
      {
        instruction: "Configurez l'adresse IP 192.168.1.100/24 sur l'interface eth0.",
        expectedCommand: ["ip addr add 192.168.1.100/24 dev eth0", "ifconfig eth0 192.168.1.100 netmask 255.255.255.0"],
        hint: "Syntaxe : `ip addr add <IP>/<masque> dev <interface>`",
        successMessage: "✅ Adresse IP configurée avec succès !",
        errorMessage: "❌ Vérifiez la syntaxe. Format : ip addr add 192.168.1.100/24 dev eth0",
        xpReward: 30,
      },
      {
        instruction: "Configurez la passerelle par défaut vers 192.168.1.1.",
        expectedCommand: ["ip route add default via 192.168.1.1", "route add default gw 192.168.1.1"],
        hint: "Utilisez `ip route add default via <IP_passerelle>`",
        successMessage: "✅ Route par défaut ajoutée ! Vous pouvez maintenant atteindre d'autres réseaux.",
        errorMessage: "❌ Syntaxe incorrecte. Essayez : ip route add default via 192.168.1.1",
        xpReward: 30,
      },
      {
        instruction: "Vérifiez la connectivité en faisant un ping vers la passerelle.",
        expectedCommand: ["ping 192.168.1.1", "ping -c 4 192.168.1.1"],
        hint: "Utilisez `ping 192.168.1.1` pour tester la connectivité.",
        successMessage: "✅ Ping réussi ! La connectivité est établie. 🎉",
        errorMessage: "❌ Essayez : ping 192.168.1.1",
        xpReward: 20,
      },
    ],
  },
  {
    id: "ospf-config",
    title: "Configurer OSPF entre routeurs",
    description: "Mettez en place le routage OSPF entre deux routeurs Cisco.",
    category: "networking",
    difficulty: "intermédiaire",
    totalXP: 250,
    steps: [
      {
        instruction: "Entrez en mode de configuration globale du routeur.",
        expectedCommand: ["configure terminal", "conf t"],
        hint: "Tapez `configure terminal` ou `conf t` pour entrer en mode config.",
        successMessage: "✅ Mode configuration activé. Router(config)#",
        errorMessage: "❌ Utilisez `configure terminal` ou `conf t`.",
        xpReward: 20,
      },
      {
        instruction: "Activez le processus OSPF avec l'ID 1.",
        expectedCommand: ["router ospf 1"],
        hint: "Syntaxe : `router ospf <process-id>`",
        successMessage: "✅ Processus OSPF 1 activé. Router(config-router)#",
        errorMessage: "❌ Tapez : router ospf 1",
        xpReward: 40,
      },
      {
        instruction: "Annoncez le réseau 192.168.1.0/24 dans l'area 0.",
        expectedCommand: ["network 192.168.1.0 0.0.0.255 area 0"],
        hint: "Syntaxe : `network <réseau> <wildcard> area <n>`. Le wildcard de /24 est 0.0.0.255.",
        successMessage: "✅ Réseau annoncé dans OSPF area 0 !",
        errorMessage: "❌ Format : network 192.168.1.0 0.0.0.255 area 0",
        xpReward: 50,
      },
      {
        instruction: "Annoncez le réseau 10.0.0.0/30 dans l'area 0 (lien inter-routeur).",
        expectedCommand: ["network 10.0.0.0 0.0.0.3 area 0"],
        hint: "Un /30 a un wildcard de 0.0.0.3.",
        successMessage: "✅ Lien inter-routeur annoncé ! Les deux routeurs peuvent maintenant former une adjacence.",
        errorMessage: "❌ Wildcard pour /30 = 0.0.0.3. Tapez : network 10.0.0.0 0.0.0.3 area 0",
        xpReward: 50,
      },
      {
        instruction: "Quittez le mode de configuration et vérifiez les voisins OSPF.",
        expectedCommand: ["end", "exit"],
        hint: "Tapez `end` pour revenir au mode privilégié.",
        successMessage: "✅ Configuration terminée ! Voisinage OSPF établi avec le routeur R2 (ID: 2.2.2.2). 🎉",
        errorMessage: "❌ Tapez `end` pour quitter.",
        xpReward: 40,
      },
    ],
  },
  {
    id: "sip-troubleshoot",
    title: "Dépanner l'enregistrement SIP",
    description: "Diagnostiquez et résolvez un problème d'enregistrement SIP sur un IPBX Asterisk.",
    category: "telecom",
    difficulty: "avancé",
    totalXP: 300,
    steps: [
      {
        instruction: "Vérifiez le statut des peers SIP enregistrés sur Asterisk.",
        expectedCommand: ["sip show peers", "asterisk -rx 'sip show peers'"],
        hint: "Utilisez `sip show peers` dans la console Asterisk.",
        successMessage: "✅ Résultat : Extension 1001 — Status: UNREACHABLE. Problème identifié !",
        errorMessage: "❌ Essayez : sip show peers",
        xpReward: 40,
      },
      {
        instruction: "Vérifiez la configuration du peer 1001 dans sip.conf.",
        expectedCommand: ["cat /etc/asterisk/sip.conf", "sip show peer 1001"],
        hint: "Consultez la config avec `cat /etc/asterisk/sip.conf` ou `sip show peer 1001`.",
        successMessage: "✅ Config trouvée : host=dynamic, port=5060. Le peer attend un REGISTER.",
        errorMessage: "❌ Essayez : sip show peer 1001",
        xpReward: 50,
      },
      {
        instruction: "Vérifiez que le port SIP 5060 est ouvert avec netstat.",
        expectedCommand: ["netstat -tulnp | grep 5060", "ss -tulnp | grep 5060"],
        hint: "Utilisez `netstat -tulnp | grep 5060` pour vérifier le port.",
        successMessage: "✅ Port 5060 est en écoute sur 0.0.0.0 — le service fonctionne.",
        errorMessage: "❌ Essayez : netstat -tulnp | grep 5060",
        xpReward: 50,
      },
      {
        instruction: "Vérifiez les règles du pare-feu pour le trafic SIP.",
        expectedCommand: ["iptables -L -n | grep 5060", "iptables -L -n"],
        hint: "Utilisez `iptables -L -n` pour voir les règles de filtrage.",
        successMessage: "✅ Problème trouvé ! Le port 5060 est bloqué par le pare-feu. Ajoutez une règle ACCEPT.",
        errorMessage: "❌ Essayez : iptables -L -n",
        xpReward: 60,
      },
      {
        instruction: "Ajoutez une règle iptables pour autoriser le trafic SIP (UDP 5060).",
        expectedCommand: ["iptables -A INPUT -p udp --dport 5060 -j ACCEPT"],
        hint: "Format : `iptables -A INPUT -p udp --dport 5060 -j ACCEPT`",
        successMessage: "✅ Règle ajoutée ! Le peer 1001 est maintenant REGISTERED. Problème résolu ! 🎉",
        errorMessage: "❌ Syntaxe : iptables -A INPUT -p udp --dport 5060 -j ACCEPT",
        xpReward: 60,
      },
    ],
  },
  {
    id: "network-outage",
    title: "Diagnostiquer une panne réseau",
    description: "Un serveur web est inaccessible. Suivez une méthodologie de dépannage structurée.",
    category: "networking",
    difficulty: "intermédiaire",
    totalXP: 200,
    steps: [
      {
        instruction: "Vérifiez d'abord si l'interface réseau est active.",
        expectedCommand: ["ip link show", "ip link", "ifconfig"],
        hint: "Utilisez `ip link show` pour voir l'état des interfaces.",
        successMessage: "✅ Interface eth0 : state UP — l'interface est active.",
        errorMessage: "❌ Essayez : ip link show",
        xpReward: 30,
      },
      {
        instruction: "Vérifiez que vous avez une adresse IP configurée.",
        expectedCommand: ["ip addr show eth0", "ip addr", "ip a"],
        hint: "Utilisez `ip addr show eth0` ou `ip a`.",
        successMessage: "✅ IP: 192.168.1.42/24 — l'adresse est configurée.",
        errorMessage: "❌ Essayez : ip addr show eth0",
        xpReward: 30,
      },
      {
        instruction: "Testez la connectivité vers la passerelle par défaut (192.168.1.1).",
        expectedCommand: ["ping 192.168.1.1", "ping -c 3 192.168.1.1"],
        hint: "Faites un `ping 192.168.1.1`.",
        successMessage: "✅ Ping OK — la passerelle est joignable.",
        errorMessage: "❌ Essayez : ping 192.168.1.1",
        xpReward: 30,
      },
      {
        instruction: "Testez la résolution DNS en faisant un ping vers google.com.",
        expectedCommand: ["ping google.com", "nslookup google.com", "dig google.com"],
        hint: "Essayez `ping google.com` ou `nslookup google.com`.",
        successMessage: "✅ Échec DNS ! Le serveur DNS ne répond pas. Vérifiez /etc/resolv.conf.",
        errorMessage: "❌ Essayez : ping google.com",
        xpReward: 40,
      },
      {
        instruction: "Vérifiez la configuration DNS dans /etc/resolv.conf.",
        expectedCommand: ["cat /etc/resolv.conf"],
        hint: "Affichez le fichier avec `cat /etc/resolv.conf`.",
        successMessage: "✅ Problème trouvé ! Le nameserver est 192.168.1.200 (serveur DNS interne en panne). Changez-le vers 8.8.8.8. Panne résolue ! 🎉",
        errorMessage: "❌ Tapez : cat /etc/resolv.conf",
        xpReward: 40,
      },
    ],
  },
];

export const sampleLesson = {
  id: "ip-addressing-lesson",
  title: "Comprendre l'adressage IP",
  courseId: "reseaux-tcp-ip",
  xpReward: 100,
  steps: {
    explain: {
      title: "1. Comprendre",
      icon: "💡",
      content: `# L'adressage IP : Votre adresse sur Internet

## Analogie simple
Imaginez qu'Internet est une gigantesque ville. Chaque maison (ordinateur) a besoin d'une **adresse postale** pour recevoir du courrier (des données). L'adresse IP, c'est exactement ça : **l'adresse de votre machine sur le réseau**.

## C'est quoi une adresse IP ?
Une adresse IPv4 est composée de **4 nombres** séparés par des points, chacun allant de 0 à 255 :

\`192.168.1.42\`

C'est comme une adresse postale en 4 parties :
- **192.168.1** → Le nom de la rue (le réseau)
- **42** → Le numéro de la maison (la machine)

## Les classes d'adresses
| Classe | Plage | Utilisation |
|--------|-------|-------------|
| A | 1.0.0.0 – 126.255.255.255 | Très grands réseaux |
| B | 128.0.0.0 – 191.255.255.255 | Réseaux moyens |
| C | 192.0.0.0 – 223.255.255.255 | Petits réseaux (le plus courant) |

## Adresses privées vs publiques
- **Privée** (votre réseau local) : 192.168.x.x, 10.x.x.x, 172.16-31.x.x
- **Publique** (Internet) : toute autre adresse routable

## Le masque de sous-réseau
Le masque dit au réseau : "Quelle partie est le réseau, quelle partie est la machine ?"
- **/24** = 255.255.255.0 → 254 machines possibles
- **/16** = 255.255.0.0 → 65 534 machines possibles`,
    },
    show: {
      title: "2. Visualiser",
      icon: "👁️",
      content: `# Architecture réseau — Visualisation

\`\`\`
        ┌──────────────────────────────────────┐
        │           INTERNET (WAN)             │
        │        IP publique : 85.23.45.1      │
        └────────────┬─────────────────────────┘
                     │
              ┌──────┴──────┐
              │   ROUTEUR   │
              │ 192.168.1.1 │  ← Passerelle par défaut
              └──────┬──────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
   │   PC1   │ │   PC2   │ │ Serveur │
   │ .1.42   │ │ .1.43   │ │ .1.100  │
   └─────────┘ └─────────┘ └─────────┘
   
   Réseau : 192.168.1.0/24
   Masque : 255.255.255.0
   Broadcast : 192.168.1.255
\`\`\`

## Flux d'un paquet
1. PC1 (192.168.1.42) veut atteindre google.com
2. Le masque /24 dit : "google.com n'est PAS sur mon réseau"
3. Le paquet est envoyé à la **passerelle** (192.168.1.1)
4. Le routeur transmet vers Internet via l'IP publique`,
    },
    practice: {
      title: "3. Pratiquer",
      icon: "⌨️",
      content: `# Commandes à pratiquer

Ouvrez le terminal ci-dessous et essayez ces commandes :

### Voir votre configuration réseau
\`\`\`bash
ip addr
\`\`\`

### Voir la table de routage
\`\`\`bash
ip route
\`\`\`

### Tester la connectivité
\`\`\`bash
ping 192.168.1.1
\`\`\`

### Voir le fichier de résolution DNS
\`\`\`bash
cat /etc/resolv.conf
\`\`\`

### Voir le fichier hosts
\`\`\`bash
cat /etc/hosts
\`\`\``,
      hasTerminal: true,
    },
    challenge: {
      title: "4. Défi",
      icon: "🏆",
      scenarioId: "ip-addressing",
    },
    quiz: {
      title: "5. Quiz",
      icon: "📝",
      questions: [
        {
          question: "Quelle est la plage d'adresses privées de classe C ?",
          options: [
            "10.0.0.0 – 10.255.255.255",
            "172.16.0.0 – 172.31.255.255",
            "192.168.0.0 – 192.168.255.255",
            "224.0.0.0 – 239.255.255.255",
          ],
          correct: 2,
          explanation: "La plage 192.168.0.0/16 est réservée pour les réseaux privés de classe C. C'est la plus utilisée dans les réseaux domestiques.",
        },
        {
          question: "Combien de machines peut contenir un réseau /24 ?",
          options: ["256", "254", "255", "128"],
          correct: 1,
          explanation: "Un /24 offre 256 adresses, mais on retire l'adresse réseau (.0) et le broadcast (.255), donc 254 machines utilisables.",
        },
        {
          question: "Quel est le rôle de la passerelle par défaut ?",
          options: [
            "Attribuer des adresses IP automatiquement",
            "Filtrer le trafic malveillant",
            "Acheminer le trafic vers des réseaux extérieurs",
            "Stocker les fichiers partagés",
          ],
          correct: 2,
          explanation: "La passerelle par défaut (default gateway) est le routeur qui achemine le trafic vers des réseaux qui ne sont pas directement connectés.",
        },
      ],
    },
  },
};

export const careerPaths = [
  {
    id: "network-engineer",
    title: "Ingénieur Réseau",
    icon: "🌐",
    description: "Concevez, déployez et maintenez des infrastructures réseau d'entreprise.",
    skills: [
      { name: "TCP/IP", level: 0 },
      { name: "Routage (OSPF/BGP)", level: 0 },
      { name: "Switching (VLAN)", level: 0 },
      { name: "Sécurité réseau", level: 0 },
      { name: "Troubleshooting", level: 0 },
      { name: "WiFi", level: 0 },
    ],
    courses: ["reseaux-tcp-ip", "ospf-bgp-avance"],
    salaryRange: "35 000 – 65 000 €",
    demandLevel: "Très élevé",
  },
  {
    id: "linux-sysadmin",
    title: "Administrateur Système Linux",
    icon: "🐧",
    description: "Gérez des serveurs Linux en production, automatisez les déploiements et assurez la disponibilité.",
    skills: [
      { name: "Linux CLI", level: 0 },
      { name: "Administration serveur", level: 0 },
      { name: "Scripting Bash", level: 0 },
      { name: "Docker/Containers", level: 0 },
      { name: "Monitoring", level: 0 },
      { name: "Sécurité système", level: 0 },
    ],
    courses: ["linux-fondamentaux", "linux-serveurs"],
    salaryRange: "32 000 – 60 000 €",
    demandLevel: "Élevé",
  },
  {
    id: "voip-specialist",
    title: "Spécialiste VoIP/IPBX",
    icon: "📞",
    description: "Déployez et maintenez des systèmes de téléphonie IP avec Asterisk, FreePBX et les protocoles SIP/RTP.",
    skills: [
      { name: "Protocole SIP", level: 0 },
      { name: "Asterisk/FreePBX", level: 0 },
      { name: "RTP/Codecs", level: 0 },
      { name: "Troubleshooting VoIP", level: 0 },
      { name: "QoS", level: 0 },
      { name: "Intégration télécom", level: 0 },
    ],
    courses: ["voip-ipbx"],
    salaryRange: "38 000 – 70 000 €",
    demandLevel: "Modéré",
  },
];

export const gamificationLevels = [
  { level: 1, title: "Débutant", xpRequired: 0, icon: "🌱" },
  { level: 2, title: "Apprenti", xpRequired: 300, icon: "📚" },
  { level: 3, title: "Praticien", xpRequired: 700, icon: "⚡" },
  { level: 4, title: "Technicien", xpRequired: 1200, icon: "🔧" },
  { level: 5, title: "Ingénieur", xpRequired: 2000, icon: "🎯" },
  { level: 6, title: "Expert", xpRequired: 3500, icon: "🏅" },
  { level: 7, title: "Architecte", xpRequired: 5500, icon: "🏛️" },
  { level: 8, title: "Maître", xpRequired: 8000, icon: "👑" },
];

export const leaderboardData = [
  { rank: 1, name: "Amadou D.", xp: 8450, level: 8, avatar: "🧑🏾‍💻", streak: 42 },
  { rank: 2, name: "Fatou S.", xp: 7200, level: 7, avatar: "👩🏾‍💻", streak: 35 },
  { rank: 3, name: "Moussa K.", xp: 6800, level: 7, avatar: "👨🏽‍💻", streak: 28 },
  { rank: 4, name: "Aïcha B.", xp: 5500, level: 6, avatar: "👩🏽‍💻", streak: 21 },
  { rank: 5, name: "Ibrahim T.", xp: 4900, level: 6, avatar: "🧑🏿‍💻", streak: 19 },
  { rank: 6, name: "Mariam L.", xp: 3800, level: 5, avatar: "👩🏿‍💻", streak: 14 },
  { rank: 7, name: "Vous", xp: 1250, level: 5, avatar: "😊", streak: 7, isCurrentUser: true },
  { rank: 8, name: "Oumar N.", xp: 1100, level: 4, avatar: "👨🏾‍💻", streak: 5 },
];
