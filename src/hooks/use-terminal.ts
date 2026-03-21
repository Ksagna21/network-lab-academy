import { useState, useCallback, useRef } from "react";

interface TerminalLine {
  type: "input" | "output" | "error";
  content: string;
}

const FILESYSTEM: Record<string, string[]> = {
  "/": ["home", "etc", "var", "usr", "tmp"],
  "/home": ["etudiant"],
  "/home/etudiant": ["documents", "projets", ".bashrc"],
  "/home/etudiant/documents": ["notes.txt", "cours-linux.pdf"],
  "/home/etudiant/projets": ["reseau-lab", "voip-config"],
  "/etc": ["hosts", "resolv.conf", "network", "passwd"],
  "/var": ["log", "www"],
  "/var/log": ["syslog", "auth.log"],
  "/usr": ["bin", "local"],
  "/tmp": [],
};

const FILE_CONTENTS: Record<string, string> = {
  "/home/etudiant/.bashrc": "# Configuration Bash\nexport PATH=$PATH:/usr/local/bin\nalias ll='ls -la'\nalias cls='clear'",
  "/home/etudiant/documents/notes.txt": "=== Notes de cours ===\n\n1. TCP/IP : modèle en 4 couches\n2. Linux : tout est fichier\n3. VoIP : SIP + RTP = communication",
  "/etc/hosts": "127.0.0.1\tlocalhost\n192.168.1.1\tgateway\n192.168.1.10\tserveur-web",
  "/etc/resolv.conf": "nameserver 8.8.8.8\nnameserver 8.8.4.4",
  "/etc/passwd": "root:x:0:0:root:/root:/bin/bash\netudiant:x:1000:1000:Étudiant:/home/etudiant:/bin/bash",
};

export function useTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", content: "Bienvenue dans le Terminal NetAcademy ! 🐧" },
    { type: "output", content: "Tapez 'help' pour voir les commandes disponibles.\n" },
  ]);
  const [cwd, setCwd] = useState("/home/etudiant");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvePath = useCallback((path: string, currentDir: string): string => {
    if (path.startsWith("/")) return path;
    if (path === "..") {
      const parts = currentDir.split("/").filter(Boolean);
      parts.pop();
      return "/" + parts.join("/");
    }
    if (path === ".") return currentDir;
    const base = currentDir === "/" ? "" : currentDir;
    return `${base}/${path}`;
  }, []);

  const executeCommand = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const newLines: TerminalLine[] = [{ type: "input", content: `${cwd} $ ${trimmed}` }];
    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const [cmd, ...args] = trimmed.split(/\s+/);

    switch (cmd) {
      case "help":
        newLines.push({
          type: "output",
          content: `Commandes disponibles :
  ls [chemin]     - Lister les fichiers
  cd <chemin>     - Changer de répertoire
  cat <fichier>   - Afficher le contenu
  pwd             - Répertoire actuel
  whoami          - Utilisateur actuel
  echo <texte>    - Afficher du texte
  clear           - Effacer le terminal
  ping <hôte>     - Simuler un ping
  ifconfig        - Voir la config réseau
  ip addr         - Voir les adresses IP
  man <cmd>       - Manuel d'une commande
  history         - Historique des commandes`,
        });
        break;

      case "ls": {
        const target = args[0] ? resolvePath(args[0], cwd) : cwd;
        const entries = FILESYSTEM[target];
        if (entries) {
          newLines.push({ type: "output", content: entries.join("  ") || "(vide)" });
        } else {
          newLines.push({ type: "error", content: `ls: impossible d'accéder à '${args[0]}': Aucun fichier ou dossier de ce type` });
        }
        break;
      }

      case "cd": {
        if (!args[0] || args[0] === "~") {
          setCwd("/home/etudiant");
          break;
        }
        const target = resolvePath(args[0], cwd);
        if (FILESYSTEM[target] !== undefined) {
          setCwd(target);
        } else {
          newLines.push({ type: "error", content: `cd: ${args[0]}: Aucun fichier ou dossier de ce type` });
        }
        break;
      }

      case "cat": {
        if (!args[0]) {
          newLines.push({ type: "error", content: "cat: opérande de fichier manquant" });
          break;
        }
        const filePath = resolvePath(args[0], cwd);
        if (FILE_CONTENTS[filePath]) {
          newLines.push({ type: "output", content: FILE_CONTENTS[filePath] });
        } else {
          newLines.push({ type: "error", content: `cat: ${args[0]}: Aucun fichier ou dossier de ce type` });
        }
        break;
      }

      case "pwd":
        newLines.push({ type: "output", content: cwd });
        break;

      case "whoami":
        newLines.push({ type: "output", content: "etudiant" });
        break;

      case "echo":
        newLines.push({ type: "output", content: args.join(" ") });
        break;

      case "clear":
        setLines([]);
        return;

      case "ping": {
        if (!args[0]) {
          newLines.push({ type: "error", content: "ping: utilisation: ping <hôte>" });
          break;
        }
        newLines.push({ type: "output", content: `PING ${args[0]} (93.184.216.34) 56(84) octets de données.` });
        for (let i = 1; i <= 3; i++) {
          const time = (Math.random() * 20 + 5).toFixed(1);
          newLines.push({ type: "output", content: `64 octets de ${args[0]}: icmp_seq=${i} ttl=56 temps=${time} ms` });
        }
        newLines.push({ type: "output", content: `\n--- ${args[0]} statistiques ping ---\n3 paquets transmis, 3 reçus, 0% perte de paquets` });
        break;
      }

      case "ifconfig":
      case "ip":
        newLines.push({
          type: "output",
          content: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>
    inet 192.168.1.42  masque 255.255.255.0  diffusion 192.168.1.255
    inet6 fe80::1  prefixlen 64  scopeid 0x20<link>
    ether 02:42:ac:11:00:02  txqueuelen 0

lo: flags=73<UP,LOOPBACK,RUNNING>
    inet 127.0.0.1  masque 255.0.0.0`,
        });
        break;

      case "man":
        if (!args[0]) {
          newLines.push({ type: "error", content: "Quelle page de manuel voulez-vous ?" });
        } else {
          newLines.push({ type: "output", content: `${args[0].toUpperCase()}(1) — Manuel de l'utilisateur\n\nNOM\n    ${args[0]} — ${args[0] === "ls" ? "lister le contenu des répertoires" : args[0] === "cd" ? "changer de répertoire" : `commande ${args[0]}`}\n\nTapez 'help' pour la liste des commandes supportées.` });
        }
        break;

      case "history":
        newLines.push({ type: "output", content: history.map((h, i) => `  ${i + 1}  ${h}`).join("\n") || "(historique vide)" });
        break;

      default:
        newLines.push({ type: "error", content: `${cmd}: commande introuvable. Tapez 'help' pour l'aide.` });
    }

    setLines(prev => [...prev, ...newLines]);
  }, [cwd, history, resolvePath]);

  return { lines, cwd, executeCommand, history, historyIndex, setHistoryIndex, inputRef };
}
