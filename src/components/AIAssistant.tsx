import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const quickReplies = [
  "Comment fonctionne OSPF ?",
  "Expliquer les permissions Linux",
  "Différence entre TCP et UDP ?",
];

const mockResponses: Record<string, string> = {
  default:
    "Je suis votre assistant IA NetAcademy ! Je peux vous aider à comprendre les concepts de réseaux, Linux et télécoms. Posez-moi une question ! 🎓",
  ospf:
    "**OSPF** (Open Shortest Path First) est un protocole de routage à état de liens. Il calcule le chemin le plus court vers chaque destination en utilisant l'algorithme de Dijkstra.\n\n🔑 Points clés :\n- Fonctionne à l'intérieur d'un AS (IGP)\n- Utilise des zones (Area) pour optimiser\n- Métrique basée sur le coût (bande passante)\n- Converge rapidement après un changement",
  permissions:
    "Les **permissions Linux** contrôlent l'accès aux fichiers :\n\n```\nrwxr-xr-x\n│││ │││ │││\n│││ │││ └── Autres (read, execute)\n│││ └───── Groupe (read, execute)\n└──────── Propriétaire (read, write, execute)\n```\n\nCommandes utiles :\n- `chmod 755 fichier` — rwxr-xr-x\n- `chown user:group fichier`\n- `ls -la` pour voir les permissions",
  tcp:
    "**TCP vs UDP** — deux protocoles de transport :\n\n| | TCP | UDP |\n|---|---|---|\n| Connexion | Oui (3-way handshake) | Non |\n| Fiabilité | Garantie | Aucune |\n| Ordre | Garanti | Non garanti |\n| Vitesse | Plus lent | Plus rapide |\n\n💡 **TCP** → Web, email, fichiers\n💡 **UDP** → VoIP, streaming, DNS",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("ospf")) return mockResponses.ospf;
  if (lower.includes("permission")) return mockResponses.permissions;
  if (lower.includes("tcp") || lower.includes("udp")) return mockResponses.tcp;
  return "Excellente question ! Dans un cours complet, je vous expliquerais cela en détail avec des schémas et des exemples pratiques. 💡\n\nPour l'instant, cette fonctionnalité est en mode démo. Bientôt, l'IA sera connectée pour des réponses en temps réel !";
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: mockResponses.default },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(text);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response },
      ]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 ${
          isOpen ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
        }`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[520px] rounded-2xl border bg-card shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-primary/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Assistant IA</h3>
              <p className="text-xs text-muted-foreground">Démo • Réseaux, Linux, Télécoms</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
              ✨ IA
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3 h-3 text-accent" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-secondary transition-colors active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez une question..."
                className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
