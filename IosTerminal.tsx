import { KeyboardEvent, useEffect, useRef, useState } from "react";

export interface TermLine {
  kind: "input" | "output" | "error";
  text: string;
}

interface Props {
  title: string;
  prompt: string;
  lines: TermLine[];
  history: string[];
  onSubmit: (line: string) => void;
  /** Appelé quand l'utilisateur tape « ? » : reçoit la ligne en cours (sans le « ? »). */
  onHelp: (line: string) => void;
  /** Complétion Tab : renvoie la ligne complétée. */
  onTab: (line: string) => string;
}

const IosTerminal = ({ title, prompt, lines, history, onSubmit, onHelp, onTab }: Props) => {
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(input);
      setInput("");
      setCursor(-1);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setInput(onTab(input));
    } else if (e.key === "?") {
      e.preventDefault();
      onHelp(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(cursor + 1, history.length - 1);
      if (next >= 0) {
        setCursor(next);
        setInput(history[history.length - 1 - next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = cursor - 1;
      setCursor(next);
      setInput(next >= 0 ? history[history.length - 1 - next] : "");
    }
  };

  return (
    <div className="rounded-lg bg-terminal terminal-glow overflow-hidden flex flex-col" onClick={() => inputRef.current?.focus()}>
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(0,0%,16%)] border-b border-[hsl(0,0%,20%)]">
        <span className="font-terminal text-xs text-[hsl(0,0%,60%)]">{title}</span>
        <span className="font-terminal text-[11px] text-[hsl(0,0%,45%)]">Tab : compléter · ? : aide · ↑↓ : historique</span>
      </div>
      <div
        role="log"
        aria-live="polite"
        aria-label={`Sortie du terminal ${title}`}
        className="p-4 overflow-y-auto h-[320px] font-terminal text-[13px] leading-relaxed"
      >
        {lines.map((l, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap break-words ${
              l.kind === "input" ? "text-terminal-prompt" : l.kind === "error" ? "text-[hsl(0,75%,68%)]" : "text-terminal-fg"
            }`}
          >
            {l.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center px-4 py-2.5 border-t border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)]">
        <label htmlFor={`term-${title}`} className="text-terminal-prompt font-terminal text-[13px] mr-1 whitespace-pre">
          {prompt}
        </label>
        <input
          id={`term-${title}`}
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-terminal-fg font-terminal text-[13px] outline-none caret-terminal-prompt"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default IosTerminal;
