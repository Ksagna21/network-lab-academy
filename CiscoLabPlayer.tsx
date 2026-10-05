import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Eye, Lightbulb, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import IosTerminal, { TermLine } from "@/components/cisco/IosTerminal";
import NetworkTopology from "@/components/cisco/NetworkTopology";
import { evaluateCheck } from "@/engine/checks";
import { NetworkSimulator } from "@/engine/simulator";
import { getLab } from "@/labs";
import { saveProgress } from "@/lib/cisco-progress";
import { CATEGORY_LABEL, DIFFICULTY_STYLE } from "@/labs/labels";
import NotFound from "./NotFound";

/** Mise en forme minimale : `code` et **gras**. */
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith("`")) {
      return (
        <code key={i} className="font-terminal text-[0.85em] px-1.5 py-0.5 rounded bg-muted text-foreground">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

interface DeviceUi {
  lines: TermLine[];
  history: string[];
}

const CiscoLabPlayer = () => {
  const { labId } = useParams();
  const lab = getLab(labId ?? "");
  if (!lab) return <NotFound />;
  return <Player key={lab.id} lab={lab} />;
};

const Player = ({ lab }: { lab: NonNullable<ReturnType<typeof getLab>> }) => {
  const sim = useMemo(() => new NetworkSimulator(lab.topology, lab.initialConfigs), [lab]);
  const baseline = useMemo(() => sim.snapshot(), [sim]);
  const [tick, setTick] = useState(0);
  const firstId = lab.topology.devices[0].id;
  const [active, setActive] = useState(firstId);
  const ui = useRef<Record<string, DeviceUi>>({});
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const celebrated = useRef(false);

  const term = (id: string): DeviceUi => {
    if (!ui.current[id]) {
      const dev = sim.getDevice(id);
      ui.current[id] = {
        history: [],
        lines: [
          {
            kind: "output",
            text:
              dev.type === "pc"
                ? `Poste ${dev.hostname}. Commandes : ipconfig, ping <ip>, ip address <ip> <masque> [passerelle].`
                : `Connecté à ${dev.hostname}. Tapez ? pour l'aide, Tab pour compléter.`,
          },
        ],
      };
    }
    return ui.current[id];
  };

  const results = useMemo(
    () => lab.objectives.map((o) => ({ ...o, result: evaluateCheck(sim, o.check) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim, lab, tick],
  );
  const done = results.filter((r) => r.result.ok).length;
  const allDone = done === results.length;

  useEffect(() => {
    saveProgress(lab.id, done, results.length);
    if (allDone && !celebrated.current) {
      celebrated.current = true;
      toast.success(`Lab terminé : +${lab.xpReward} XP`, { description: lab.title });
    }
    if (!allDone) celebrated.current = false;
  }, [done, allDone, lab, results.length]);

  const submit = (line: string) => {
    const t = term(active);
    const prompt = sim.getPrompt(active);
    const r = sim.execute(active, line);
    t.lines.push({ kind: "input", text: `${prompt}${line}` });
    if (r.output) t.lines.push({ kind: r.error ? "error" : "output", text: r.output });
    if (line.trim()) t.history.push(line);
    setTick((n) => n + 1);
  };

  const help = (line: string) => {
    const t = term(active);
    t.lines.push({ kind: "input", text: `${sim.getPrompt(active)}${line}?` });
    t.lines.push({ kind: "output", text: sim.help(active, line) });
    setTick((n) => n + 1);
  };

  const reset = () => {
    sim.restore(baseline);
    ui.current = {};
    setHintsShown(0);
    setShowSolution(false);
    setTick((n) => n + 1);
    toast("Lab réinitialisé");
  };

  const t = term(active);
  const device = sim.getDevice(active);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-20 pb-12">
        <Link to="/cisco-labs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Tous les labs Cisco
        </Link>

        <header className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="text-2xl md:text-3xl font-display font-bold mr-auto">{lab.title}</h1>
          <span className="text-sm text-muted-foreground">{CATEGORY_LABEL[lab.category]}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${DIFFICULTY_STYLE[lab.difficulty]}`}>{lab.difficulty}</span>
          <span className="text-sm font-medium text-primary">{lab.xpReward} XP</span>
        </header>

        <div className="grid lg:grid-cols-[minmax(300px,380px)_1fr] gap-6 items-start">
          {/* Énoncé et objectifs */}
          <aside className="space-y-5">
            <section className="rounded-xl border bg-card p-5 space-y-3">
              <h2 className="font-display font-semibold">Énoncé</h2>
              {lab.instructions.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {inline(p)}
                </p>
              ))}
            </section>

            <section className="rounded-xl border bg-card p-5" aria-labelledby="obj-title">
              <div className="flex items-baseline justify-between mb-3">
                <h2 id="obj-title" className="font-display font-semibold">
                  Objectifs
                </h2>
                <span className="text-sm text-muted-foreground" aria-live="polite">
                  {done} / {results.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-4" aria-hidden>
                <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${(done / results.length) * 100}%` }} />
              </div>
              <ul className="space-y-2.5">
                {results.map((o) => (
                  <li key={o.id} className="flex gap-2.5 text-sm">
                    {o.result.ok ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" aria-label="Validé" />
                    ) : (
                      <Circle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" aria-label="À faire" />
                    )}
                    <span className={o.result.ok ? "text-foreground" : "text-muted-foreground"}>{o.description}</span>
                  </li>
                ))}
              </ul>
              {allDone && (
                <p className="mt-4 text-sm font-medium text-primary" role="status">
                  Tous les objectifs sont validés. Bien joué !
                </p>
              )}
            </section>

            <section className="rounded-xl border bg-card p-5 space-y-3">
              <h2 className="font-display font-semibold">Aide</h2>
              {lab.hints.slice(0, hintsShown).map((h, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground flex gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-accent" aria-hidden />
                  <span>{inline(h)}</span>
                </p>
              ))}
              <div className="flex flex-wrap gap-2">
                {hintsShown < lab.hints.length && (
                  <Button size="sm" variant="outline" onClick={() => setHintsShown((n) => n + 1)}>
                    <Lightbulb className="w-4 h-4 mr-1.5" aria-hidden /> Indice ({hintsShown}/{lab.hints.length})
                  </Button>
                )}
                {Object.keys(lab.solution).length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setShowSolution((v) => !v)} aria-expanded={showSolution}>
                    <Eye className="w-4 h-4 mr-1.5" aria-hidden /> {showSolution ? "Masquer la solution" : "Voir la solution"}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-1.5" aria-hidden /> Réinitialiser
                </Button>
              </div>
              {showSolution && (
                <div className="space-y-3 pt-1">
                  {Object.entries(lab.solution).map(([id, lines]) => (
                    <div key={id}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{sim.getDevice(id).label ?? id}</p>
                      <pre className="rounded-md bg-terminal text-terminal-fg font-terminal text-xs p-3 overflow-x-auto">{lines.join("\n")}</pre>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>

          {/* Topologie et terminaux */}
          <div className="space-y-4 min-w-0">
            <NetworkTopology sim={sim} version={tick} activeId={active} onSelect={setActive} />
            <div role="tablist" aria-label="Équipements" className="flex flex-wrap gap-1.5">
              {lab.topology.devices.map((d) => (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={active === d.id}
                  onClick={() => setActive(d.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-terminal transition-colors ${
                    active === d.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                  }`}
                >
                  {sim.getDevice(d.id).hostname}
                </button>
              ))}
            </div>
            <IosTerminal
              key={active}
              title={`${device.hostname} (${active})`}
              prompt={sim.getPrompt(active)}
              lines={t.lines}
              history={t.history}
              onSubmit={submit}
              onHelp={help}
              onTab={(l) => sim.complete(active, l)}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CiscoLabPlayer;
