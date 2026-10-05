// Objectifs vérifiables : on valide l'ÉTAT du réseau simulé, pas les touches tapées.
import { z } from "zod";
import { normalizeIfName } from "./interfaces";
import { isUp, lookupRoute, ospfAdjacencies, routesOf } from "./network";
import type { NetworkSimulator } from "./simulator";

const device = z.string();

export const CheckSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("running-config-contains"), device, lines: z.array(z.string()).min(1) }),
  z.object({ type: z.literal("startup-config-contains"), device, lines: z.array(z.string()).min(1) }),
  z.object({ type: z.literal("hostname-is"), device, hostname: z.string() }),
  z.object({ type: z.literal("ping-succeeds"), from: device, to: z.string() }),
  z.object({ type: z.literal("ping-fails"), from: device, to: z.string() }),
  z.object({
    type: z.literal("route-exists"),
    device,
    network: z.string(),
    mask: z.string(),
    protocol: z.enum(["connected", "static", "ospf"]).optional(),
  }),
  z.object({
    type: z.literal("vlans-exist"),
    device,
    vlans: z.array(z.object({ id: z.number(), name: z.string().optional() })).min(1),
  }),
  z.object({
    type: z.literal("interfaces-ip"),
    device,
    interfaces: z.array(z.object({ iface: z.string(), ip: z.string(), mask: z.string() })).min(1),
  }),
  z.object({ type: z.literal("interfaces-up"), device, interfaces: z.array(z.string()).min(1) }),
  z.object({
    type: z.literal("switchports"),
    device,
    ports: z
      .array(
        z.object({
          iface: z.string(),
          mode: z.enum(["access", "trunk"]),
          accessVlan: z.number().optional(),
          trunkAllows: z.array(z.number()).optional(),
        }),
      )
      .min(1),
  }),
  z.object({ type: z.literal("ospf-neighbors"), device, count: z.number().min(1) }),
]);

export type Check = z.infer<typeof CheckSchema>;

export interface CheckResult {
  ok: boolean;
  detail?: string;
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export function evaluateCheck(sim: NetworkSimulator, c: Check): CheckResult {
  const net = sim.net;
  const dev = net.devices[(c as { device?: string }).device ?? (c as { from?: string }).from ?? ""];
  switch (c.type) {
    case "running-config-contains": {
      const have = new Set(sim.runningConfigLines(c.device).map(norm));
      const missing = c.lines.filter((l) => !have.has(norm(l)));
      return { ok: !missing.length, detail: missing.length ? `Manquant : ${missing.join(", ")}` : undefined };
    }
    case "startup-config-contains": {
      const saved = (dev.startupConfig ?? "").split("\n").map(norm);
      const missing = c.lines.filter((l) => !saved.includes(norm(l)));
      return { ok: !missing.length, detail: missing.length ? "Configuration non enregistrée" : undefined };
    }
    case "hostname-is":
      return { ok: dev.hostname === c.hostname };
    case "ping-succeeds":
      return { ok: sim.ping(c.from, c.to) };
    case "ping-fails":
      return { ok: !sim.ping(c.from, c.to) };
    case "route-exists": {
      const r = routesOf(net, c.device).find(
        (x) => x.network === c.network && x.mask === c.mask && (!c.protocol || x.protocol === c.protocol),
      );
      return { ok: !!r };
    }
    case "vlans-exist": {
      const bad = c.vlans.filter((v) => {
        const have = dev.vlans[v.id];
        return !have || (v.name !== undefined && have.name !== v.name);
      });
      return { ok: !bad.length, detail: bad.length ? `VLAN manquant ou mal nommé : ${bad.map((b) => b.id).join(", ")}` : undefined };
    }
    case "interfaces-ip": {
      const bad = c.interfaces.filter((x) => {
        const n = normalizeIfName(x.iface);
        const i = n ? dev.interfaces[n] : undefined;
        return !i || i.ip !== x.ip || i.mask !== x.mask || !isUp(net, c.device, n!);
      });
      return { ok: !bad.length, detail: bad.length ? `À corriger : ${bad.map((b) => b.iface).join(", ")}` : undefined };
    }
    case "interfaces-up": {
      const bad = c.interfaces.filter((x) => {
        const n = normalizeIfName(x);
        return !n || !dev.interfaces[n] || !isUp(net, c.device, n);
      });
      return { ok: !bad.length };
    }
    case "switchports": {
      const bad = c.ports.filter((p) => {
        const n = normalizeIfName(p.iface);
        const i = n ? dev.interfaces[n] : undefined;
        if (!i || i.switchportMode !== p.mode) return true;
        if (p.accessVlan !== undefined && i.accessVlan !== p.accessVlan) return true;
        if (p.trunkAllows && !p.trunkAllows.every((v) => i.trunkAllowed === "all" || i.trunkAllowed.includes(v))) return true;
        return false;
      });
      return { ok: !bad.length, detail: bad.length ? `À corriger : ${bad.map((b) => b.iface).join(", ")}` : undefined };
    }
    case "ospf-neighbors":
      return { ok: ospfAdjacencies(net, c.device).length >= c.count };
  }
}

export { lookupRoute };
