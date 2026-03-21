import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useTerminal } from "@/hooks/use-terminal";

const TerminalSimulator = () => {
  const { lines, cwd, executeCommand, history, historyIndex, setHistoryIndex } = useTerminal();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      if (newIndex >= 0) setInput(history[history.length - 1 - newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
      setHistoryIndex(newIndex);
      setInput(newIndex >= 0 ? history[history.length - 1 - newIndex] : "");
    }
  };

  return (
    <div
      className="rounded-lg bg-terminal terminal-glow overflow-hidden flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(0,0%,16%)] border-b border-[hsl(0,0%,20%)]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[hsl(0,70%,55%)]" />
          <span className="w-3 h-3 rounded-full bg-[hsl(45,80%,55%)]" />
          <span className="w-3 h-3 rounded-full bg-[hsl(120,50%,45%)]" />
        </div>
        <span className="font-terminal text-xs text-[hsl(0,0%,55%)] ml-2">terminal — etudiant@netacademy</span>
      </div>

      {/* Output */}
      <div className="p-4 overflow-y-auto max-h-[400px] min-h-[250px] font-terminal text-sm leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap ${
            line.type === "input" ? "text-terminal-prompt font-medium" :
            line.type === "error" ? "text-destructive" :
            "text-terminal-fg"
          }`}>
            {line.type === "input" ? `❯ ${line.content.split("$ ")[1]}` : line.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center px-4 py-3 border-t border-[hsl(0,0%,18%)] bg-[hsl(0,0%,10%)]">
        <span className="text-terminal-prompt font-terminal text-sm mr-2">
          {cwd.replace("/home/etudiant", "~")} ❯
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-terminal-fg font-terminal text-sm outline-none caret-terminal-prompt"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default TerminalSimulator;
