import { Course, UserProgress } from "./types";

export const sampleCourses: Course[] = [
  {
    id: "linux-fondamentaux",
    title: "Les Fondamentaux de Linux",
    description: "Maîtrisez les bases de Linux : ligne de commande, gestion de fichiers, permissions et administration système.",
    category: "linux",
    level: "débutant",
    thumbnail: "/placeholder.svg",
    duration: "12h",
    lessonsCount: 24,
    isFree: true,
    xpReward: 500,
    modules: [
      {
        id: "m1",
        title: "Introduction à Linux",
        lessons: [
          { id: "l1", title: "Qu'est-ce que Linux ?", type: "text", duration: "10 min", completed: true },
          { id: "l2", title: "Installer Ubuntu", type: "video", duration: "15 min", completed: true },
          { id: "l3", title: "Le terminal : votre meilleur ami", type: "lab", duration: "20 min", completed: false },
          { id: "l4", title: "Quiz : Introduction", type: "quiz", duration: "5 min" },
        ],
      },
      {
        id: "m2",
        title: "Navigation et fichiers",
        lessons: [
          { id: "l5", title: "Commandes de navigation (cd, ls, pwd)", type: "lab", duration: "15 min" },
          { id: "l6", title: "Créer, copier et déplacer des fichiers", type: "lab", duration: "20 min" },
          { id: "l7", title: "Les permissions Linux", type: "text", duration: "15 min" },
          { id: "l8", title: "Quiz : Fichiers et permissions", type: "quiz", duration: "5 min" },
        ],
      },
      {
        id: "m3",
        title: "Administration système",
        lessons: [
          { id: "l9", title: "Gestion des utilisateurs", type: "lab", duration: "20 min" },
          { id: "l10", title: "Les processus Linux", type: "text", duration: "15 min" },
          { id: "l11", title: "Installer des paquets", type: "lab", duration: "15 min" },
          { id: "l12", title: "Projet : Configurer un serveur web", type: "lab", duration: "30 min" },
        ],
      },
    ],
  },
  {
    id: "reseaux-tcp-ip",
    title: "Réseaux TCP/IP de A à Z",
    description: "Comprenez le modèle TCP/IP, le routage, les sous-réseaux et la configuration réseau en conditions réelles.",
    category: "networking",
    level: "débutant",
    thumbnail: "/placeholder.svg",
    duration: "18h",
    lessonsCount: 36,
    isFree: true,
    xpReward: 750,
    modules: [
      {
        id: "m4",
        title: "Introduction aux réseaux",
        lessons: [
          { id: "l13", title: "C'est quoi un réseau ?", type: "text", duration: "10 min", completed: true },
          { id: "l14", title: "Le modèle OSI vs TCP/IP", type: "video", duration: "20 min", completed: true },
          { id: "l15", title: "Adressage IP et sous-réseaux", type: "text", duration: "25 min", completed: true },
          { id: "l16", title: "Lab : Configurer une interface réseau", type: "lab", duration: "20 min" },
        ],
      },
      {
        id: "m5",
        title: "Routage et commutation",
        lessons: [
          { id: "l17", title: "Tables de routage", type: "text", duration: "15 min" },
          { id: "l18", title: "Routage statique vs dynamique", type: "video", duration: "20 min" },
          { id: "l19", title: "Lab : Configurer OSPF", type: "lab", duration: "30 min" },
          { id: "l20", title: "Quiz : Routage", type: "quiz", duration: "10 min" },
        ],
      },
    ],
  },
  {
    id: "voip-ipbx",
    title: "VoIP et IPBX avec Asterisk",
    description: "Déployez un système téléphonique IP complet avec Asterisk. De la théorie SIP aux configurations avancées.",
    category: "telecom",
    level: "intermédiaire",
    thumbnail: "/placeholder.svg",
    duration: "15h",
    lessonsCount: 28,
    isFree: false,
    xpReward: 800,
    modules: [
      {
        id: "m6",
        title: "Introduction à la VoIP",
        lessons: [
          { id: "l21", title: "Comprendre la VoIP", type: "text", duration: "15 min" },
          { id: "l22", title: "Le protocole SIP", type: "video", duration: "20 min" },
          { id: "l23", title: "Lab : Installer Asterisk", type: "lab", duration: "25 min" },
        ],
      },
    ],
  },
  {
    id: "ospf-bgp-avance",
    title: "OSPF & BGP Avancé",
    description: "Plongez dans les protocoles de routage avancés. Configuration multi-area OSPF et peering BGP.",
    category: "networking",
    level: "avancé",
    thumbnail: "/placeholder.svg",
    duration: "20h",
    lessonsCount: 32,
    isFree: false,
    xpReward: 1200,
    modules: [
      {
        id: "m7",
        title: "OSPF Multi-Area",
        lessons: [
          { id: "l24", title: "Architecture OSPF multi-area", type: "text", duration: "20 min" },
          { id: "l25", title: "Lab : Configurer OSPF multi-area", type: "lab", duration: "30 min" },
        ],
      },
    ],
  },
  {
    id: "linux-serveurs",
    title: "Linux : Administration de Serveurs",
    description: "Administrez des serveurs Linux en production : Apache, Nginx, DNS, DHCP et sécurité.",
    category: "linux",
    level: "intermédiaire",
    thumbnail: "/placeholder.svg",
    duration: "16h",
    lessonsCount: 30,
    isFree: false,
    xpReward: 900,
    modules: [
      {
        id: "m8",
        title: "Serveurs Web",
        lessons: [
          { id: "l26", title: "Apache vs Nginx", type: "text", duration: "15 min" },
          { id: "l27", title: "Lab : Déployer Nginx", type: "lab", duration: "25 min" },
        ],
      },
    ],
  },
];

export const sampleUserProgress: UserProgress = {
  coursesEnrolled: 3,
  coursesCompleted: 1,
  totalXP: 1250,
  level: 5,
  currentStreak: 7,
  badges: [
    { id: "b1", title: "Premier pas", icon: "🐣", earnedAt: "2024-01-15", description: "Terminer votre première leçon" },
    { id: "b2", title: "Explorateur Linux", icon: "🐧", earnedAt: "2024-02-01", description: "Terminer le cours Linux Fondamentaux" },
    { id: "b3", title: "Série de 7 jours", icon: "🔥", earnedAt: "2024-03-10", description: "Apprendre 7 jours consécutifs" },
    { id: "b4", title: "Maître du réseau", icon: "🌐", description: "Terminer tous les cours réseau" },
    { id: "b5", title: "Hacker éthique", icon: "🛡️", description: "Terminer le lab de sécurité" },
  ],
  recentActivity: [
    { id: "a1", type: "lesson_completed", title: "Le modèle OSI vs TCP/IP", timestamp: "Il y a 2h", xpEarned: 25 },
    { id: "a2", type: "badge_earned", title: "Série de 7 jours", timestamp: "Aujourd'hui", xpEarned: 100 },
    { id: "a3", type: "quiz_passed", title: "Quiz : Introduction aux réseaux", timestamp: "Hier", xpEarned: 50 },
  ],
};
