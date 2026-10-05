import { Monitor, Network, Router } from "lucide-react";
import { shortIfName } from "@/engine/interfaces";
import { ifaceStatus } from "@/engine/network";
import type { NetworkSimulator } from "@/engine/simulator";
import type { DeviceType } from "@/engine/types";

interface Props {
  sim: NetworkSimulator;
  /** Change à chaque commande pour recalculer l'état des liens. */
  version: number;
  activeId: string;
  onSelect: (id: string) => void;
}

const W = 640;
const H = 280;
const ICON: Record<DeviceType, typeof Router> = { router: Router, switch: Network, pc: Monitor };
const KIND_LABEL: Record<DeviceType, string> = { router: "Routeur", switch: "Switch", pc: "Poste" };

const NetworkTopology = ({ sim, version, activeId, onSelect }: Props) => {
  const { devices, links } = sim.net;
  const pos = (id: string) => ({ x: (devices[id].x / 100) * (W - 120) + 60, y: (devices[id].y / 100) * (H - 100) + 44 });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="Topologie du réseau"
      className="w-full h-auto rounded-lg border bg-card"
      data-version={version}
    >
      {links.map((l, i) => {
        const a = pos(l.a.device);
        const b = pos(l.b.device);
        const sa = ifaceStatus(sim.net, l.a.device, l.a.iface);
        const sb = ifaceStatus(sim.net, l.b.device, l.b.iface);
        const up = sa.protocol === "up" && sb.protocol === "up";
        const t = 0.26;
        const label = (from: typeof a, to: typeof b, name: string) => ({
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t - 7,
          name: shortIfName(name),
        });
        const la = label(a, b, l.a.iface);
        const lb = label(b, a, l.b.iface);
        return (
          <g key={i}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={up ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              strokeWidth={up ? 2.5 : 2}
              strokeDasharray={up ? undefined : "5 5"}
              opacity={up ? 1 : 0.7}
            />
            {[la, lb].map((p, k) => (
              <text key={k} x={p.x} y={p.y} textAnchor="middle" className="fill-muted-foreground font-terminal" fontSize="10">
                {p.name}
              </text>
            ))}
            <title>{`${l.a.device} ${l.a.iface} ↔ ${l.b.device} ${l.b.iface} — ${up ? "actif" : "inactif"}`}</title>
          </g>
        );
      })}

      {Object.values(devices).map((d) => {
        const { x, y } = pos(d.id);
        const Icon = ICON[d.type];
        const active = d.id === activeId;
        return (
          <g
            key={d.id}
            role="button"
            tabIndex={0}
            aria-label={`${KIND_LABEL[d.type]} ${d.hostname}${active ? " (sélectionné)" : ""}`}
            onClick={() => onSelect(d.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(d.id)}
            className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[hsl(var(--ring))] [&:focus-visible>rect]:stroke-[3]"
          >
            <rect
              x={x - 28}
              y={y - 28}
              width="56"
              height="56"
              rx="12"
              className={active ? "fill-primary" : "fill-secondary"}
              stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
              strokeWidth="2"
            />
            <Icon x={x - 16} y={y - 16} width="32" height="32" className={active ? "text-primary-foreground" : "text-foreground"} strokeWidth={1.75} />
            <text x={x} y={y + 46} textAnchor="middle" className="fill-foreground font-display" fontSize="13" fontWeight="600">
              {d.hostname}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default NetworkTopology;
