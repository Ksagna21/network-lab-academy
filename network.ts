// Modèle réseau : état des liens, domaines de diffusion (L2), routage (connecté / statique / OSPF) et ping.
import { inSubnet, ipToInt, matchesWildcard, maskToPrefix, networkOf } from "./ip";
import { normalizeIfName } from "./interfaces";
import type { DeviceState, Endpoint, InterfaceState, NetState } from "./types";

export function parseEndpoint(raw: string): Endpoint {
  const [device, port] = raw.split(":");
  const iface = normalizeIfName(port ?? "");
  if (!device || !iface) throw new Error(`Extrémité de lien invalide : "${raw}" (format attendu : R1:Gi0/0)`);
  return { device, iface };
}

export function peerOf(net: NetState, ep: Endpoint): Endpoint | undefined {
  for (const l of net.links) {
    if (l.a.device === ep.device && l.a.iface === ep.iface) return l.b;
    if (l.b.device === ep.device && l.b.iface === ep.iface) return l.a;
  }
  return undefined;
}

export function allowsVlan(i: InterfaceState, vlan: number): boolean {
  return i.trunkAllowed === "all" || i.trunkAllowed.includes(vlan);
}

function physicalLinkUp(net: NetState, device: string, iface: string): boolean {
  const me = net.devices[device]?.interfaces[iface];
  if (!me || me.shutdown) return false;
  const peer = peerOf(net, { device, iface });
  if (!peer) return false;
  const p = net.devices[peer.device]?.interfaces[peer.iface];
  return !!p && !p.shutdown;
}

function sviActive(net: NetState, device: string, vlan: number): boolean {
  const dev = net.devices[device];
  if (!dev.vlans[vlan]) return false;
  return Object.values(dev.interfaces).some(
    (i) =>
      i.kind === "physical" &&
      physicalLinkUp(net, device, i.name) &&
      (i.switchportMode === "access" ? i.accessVlan === vlan : allowsVlan(i, vlan)),
  );
}

export function ifaceStatus(
  net: NetState,
  device: string,
  iface: string,
): { status: "up" | "down" | "administratively down"; protocol: "up" | "down" } {
  const i = net.devices[device].interfaces[iface];
  if (i.shutdown) return { status: "administratively down", protocol: "down" };
  if (i.kind === "loopback") return { status: "up", protocol: "up" };
  if (i.kind === "svi") {
    const up = sviActive(net, device, Number(iface.replace("Vlan", "")));
    return { status: up ? "up" : "down", protocol: up ? "up" : "down" };
  }
  const up = physicalLinkUp(net, device, iface);
  return { status: up ? "up" : "down", protocol: up ? "up" : "down" };
}

export function isUp(net: NetState, device: string, iface: string): boolean {
  const s = ifaceStatus(net, device, iface);
  return s.status === "up" && s.protocol === "up";
}

/** Points de terminaison L3 atteignables en couche 2 depuis une interface (hors elle-même). */
export function l2Domain(net: NetState, start: Endpoint): Endpoint[] {
  const result: Endpoint[] = [];
  const seen = new Set<string>();
  const startDev = net.devices[start.device];
  const startIface = startDev.interfaces[start.iface];

  type Frame = { device: string; vlan: number };
  const queue: Frame[] = [];

  const deliver = (to: Endpoint, tagged: number | null) => {
    const dev = net.devices[to.device];
    const i = dev.interfaces[to.iface];
    if (!i || !physicalLinkUp(net, to.device, to.iface)) return;
    if (dev.type !== "switch") {
      if (tagged === null && !(to.device === start.device && to.iface === start.iface)) result.push(to);
      return;
    }
    let vlan: number;
    if (i.switchportMode === "access") {
      if (tagged !== null && tagged !== i.accessVlan) return;
      vlan = i.accessVlan;
    } else {
      vlan = tagged ?? 1;
      if (!allowsVlan(i, vlan)) return;
    }
    const key = `${to.device}|${vlan}`;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push({ device: to.device, vlan });
  };

  if (startDev.type === "switch" && startIface.kind === "svi") {
    const vlan = Number(start.iface.replace("Vlan", ""));
    seen.add(`${start.device}|${vlan}`);
    queue.push({ device: start.device, vlan });
  } else {
    const peer = peerOf(net, start);
    if (peer) deliver(peer, null);
  }

  while (queue.length) {
    const { device, vlan } = queue.shift()!;
    const sw = net.devices[device];
    const svi = sw.interfaces[`Vlan${vlan}`];
    if (svi && svi.ip && isUp(net, device, svi.name) && !(device === start.device && svi.name === start.iface)) {
      result.push({ device, iface: svi.name });
    }
    for (const p of Object.values(sw.interfaces)) {
      if (p.kind !== "physical" || !physicalLinkUp(net, device, p.name)) continue;
      const peer = peerOf(net, { device, iface: p.name })!;
      if (p.switchportMode === "access") {
        if (p.accessVlan === vlan) deliver(peer, null);
      } else if (allowsVlan(p, vlan)) {
        deliver(peer, vlan === 1 ? null : vlan);
      }
    }
  }
  return result;
}

// ───────────────────────────── Routage ─────────────────────────────

export interface Route {
  network: string;
  mask: string;
  prefix: number;
  protocol: "connected" | "static" | "ospf";
  ad: number;
  metric: number;
  nextHop?: string;
  iface?: string;
}

export function routerIdOf(net: NetState, dev: DeviceState): string {
  if (dev.ospf?.routerId) return dev.ospf.routerId;
  const ips = (kind: InterfaceState["kind"] | "any") =>
    Object.values(dev.interfaces)
      .filter((i) => i.ip && (kind === "any" || i.kind === kind) && isUp(net, dev.id, i.name))
      .map((i) => i.ip!)
      .sort((a, b) => ipToInt(b) - ipToInt(a));
  return ips("loopback")[0] ?? ips("any")[0] ?? "0.0.0.0";
}

interface OspfIf {
  device: string;
  iface: string;
  ip: string;
  mask: string;
  subnet: string;
  area: string;
  cost: number;
  loopback: boolean;
}

export interface OspfAdjacency {
  device: string;
  iface: string;
  ip: string;
  neighborDevice: string;
  neighborIface: string;
  neighborIp: string;
  neighborId: string;
  neighborIsDr: boolean;
}

interface OspfModel {
  version: number;
  adjacencies: OspfAdjacency[];
  routes: Record<string, Route[]>;
}

const ospfCache = new WeakMap<NetState, OspfModel>();

function computeOspf(net: NetState): OspfModel {
  const ifs: OspfIf[] = [];
  for (const dev of Object.values(net.devices)) {
    if (dev.type !== "router" || !dev.ospf) continue;
    for (const i of Object.values(dev.interfaces)) {
      if (!i.ip || !i.mask || !isUp(net, dev.id, i.name)) continue;
      const n = dev.ospf.networks.find((o) => matchesWildcard(i.ip!, o.network, o.wildcard));
      if (!n) continue;
      const loopback = i.kind === "loopback";
      ifs.push({
        device: dev.id,
        iface: i.name,
        ip: i.ip,
        mask: loopback ? "255.255.255.255" : i.mask,
        subnet: loopback ? i.ip : networkOf(i.ip, i.mask),
        area: n.area,
        cost: i.ospfCost ?? 1,
        loopback,
      });
    }
  }

  const adjacencies: OspfAdjacency[] = [];
  for (const a of ifs) {
    if (a.loopback) continue;
    for (const ep of l2Domain(net, { device: a.device, iface: a.iface })) {
      const b = ifs.find((x) => x.device === ep.device && x.iface === ep.iface);
      if (!b || b.device === a.device || b.loopback) continue;
      if (b.subnet !== a.subnet || b.mask !== a.mask || b.area !== a.area) continue;
      const idA = routerIdOf(net, net.devices[a.device]);
      const idB = routerIdOf(net, net.devices[b.device]);
      adjacencies.push({
        device: a.device,
        iface: a.iface,
        ip: a.ip,
        neighborDevice: b.device,
        neighborIface: b.iface,
        neighborIp: b.ip,
        neighborId: idB,
        neighborIsDr: ipToInt(idB) > ipToInt(idA),
      });
    }
  }

  const routes: Record<string, Route[]> = {};
  const routers = [...new Set(ifs.map((i) => i.device))];
  for (const r of routers) {
    const dist: Record<string, number> = { [r]: 0 };
    const first: Record<string, { iface: string; nextHop: string }> = {};
    const done = new Set<string>();
    while (true) {
      const cur = Object.keys(dist)
        .filter((d) => !done.has(d))
        .sort((x, y) => dist[x] - dist[y])[0];
      if (!cur) break;
      done.add(cur);
      for (const adj of adjacencies.filter((x) => x.device === cur)) {
        const cost = ifs.find((i) => i.device === cur && i.iface === adj.iface)!.cost;
        const nd = dist[cur] + cost;
        if (dist[adj.neighborDevice] === undefined || nd < dist[adj.neighborDevice]) {
          dist[adj.neighborDevice] = nd;
          first[adj.neighborDevice] =
            cur === r ? { iface: adj.iface, nextHop: adj.neighborIp } : first[cur];
        }
      }
    }
    const best: Record<string, Route> = {};
    for (const o of ifs) {
      if (o.device === r || dist[o.device] === undefined) continue;
      if (ifs.some((m) => m.device === r && m.subnet === o.subnet && m.mask === o.mask)) continue;
      if (net.devices[r].interfaces && Object.values(net.devices[r].interfaces).some(
        (i) => i.ip && i.mask && isUp(net, r, i.name) && networkOf(i.ip, i.mask) === o.subnet && i.mask === o.mask,
      )) continue;
      const key = `${o.subnet}/${o.mask}`;
      const metric = dist[o.device] + o.cost;
      if (!best[key] || metric < best[key].metric) {
        best[key] = {
          network: o.subnet,
          mask: o.mask,
          prefix: maskToPrefix(o.mask),
          protocol: "ospf",
          ad: 110,
          metric,
          nextHop: first[o.device].nextHop,
          iface: first[o.device].iface,
        };
      }
    }
    routes[r] = Object.values(best);
  }
  return { version: net.version, adjacencies, routes };
}

function ospf(net: NetState): OspfModel {
  const c = ospfCache.get(net);
  if (c && c.version === net.version) return c;
  const m = computeOspf(net);
  ospfCache.set(net, m);
  return m;
}

export function ospfAdjacencies(net: NetState, device: string): OspfAdjacency[] {
  return ospf(net).adjacencies.filter((a) => a.device === device);
}

export function routesOf(net: NetState, deviceId: string): Route[] {
  const dev = net.devices[deviceId];
  const out: Route[] = [];
  const connected: Route[] = [];
  for (const i of Object.values(dev.interfaces)) {
    if (!i.ip || !i.mask || !isUp(net, deviceId, i.name)) continue;
    connected.push({
      network: networkOf(i.ip, i.mask),
      mask: i.mask,
      prefix: maskToPrefix(i.mask),
      protocol: "connected",
      ad: 0,
      metric: 0,
      iface: i.name,
    });
  }
  out.push(...connected);

  const viaConnected = (nh: string) => connected.find((c) => inSubnet(nh, c.network, c.mask));

  if (dev.type === "router") {
    for (const s of dev.staticRoutes) {
      const c = viaConnected(s.nextHop);
      if (!c) continue; // route inactive : prochain saut injoignable
      out.push({
        network: s.network,
        mask: s.mask,
        prefix: maskToPrefix(s.mask),
        protocol: "static",
        ad: 1,
        metric: 0,
        nextHop: s.nextHop,
        iface: c.iface,
      });
    }
    out.push(...(ospf(net).routes[deviceId] ?? []));
  }
  if (dev.defaultGateway) {
    const c = viaConnected(dev.defaultGateway);
    if (c) {
      out.push({
        network: "0.0.0.0",
        mask: "0.0.0.0",
        prefix: 0,
        protocol: "static",
        ad: 1,
        metric: 0,
        nextHop: dev.defaultGateway,
        iface: c.iface,
      });
    }
  }
  return out;
}

export function lookupRoute(net: NetState, deviceId: string, dst: string): Route | undefined {
  return routesOf(net, deviceId)
    .filter((r) => inSubnet(dst, r.network, r.mask))
    .sort((a, b) => b.prefix - a.prefix || a.ad - b.ad || a.metric - b.metric)[0];
}

// ───────────────────────────── Ping ─────────────────────────────

export function ownsIp(net: NetState, deviceId: string, ip: string): boolean {
  return Object.values(net.devices[deviceId].interfaces).some(
    (i) => i.ip === ip && isUp(net, deviceId, i.name),
  );
}

export interface TraceResult {
  ok: boolean;
  /** "no-route" → réponse ICMP « inaccessible » (U) ; "timeout" → pas de réponse (.) */
  reason?: "no-route" | "timeout";
  hops: string[];
  srcIp?: string;
  endDevice?: string;
}

export function traceIp(net: NetState, src: string, dst: string): TraceResult {
  const hops: string[] = [src];
  let cur = src;
  let srcIp: string | undefined;
  for (let ttl = 0; ttl < 32; ttl++) {
    if (ownsIp(net, cur, dst)) {
      return { ok: true, hops, srcIp: srcIp ?? dst, endDevice: cur };
    }
    // Seuls les routeurs relaient les paquets qui ne leur sont pas destinés.
    if (cur !== src && net.devices[cur].type !== "router") return { ok: false, reason: "timeout", hops };
    const route = lookupRoute(net, cur, dst);
    if (!route || !route.iface) return { ok: false, reason: "no-route", hops };
    const nextIp = route.nextHop ?? dst;
    const iface = net.devices[cur].interfaces[route.iface];
    if (cur === src) srcIp = iface.ip;
    const ep = l2Domain(net, { device: cur, iface: route.iface }).find((e) => {
      const i = net.devices[e.device].interfaces[e.iface];
      return i.ip === nextIp && isUp(net, e.device, e.iface);
    });
    if (!ep) return { ok: false, reason: "timeout", hops };
    cur = ep.device;
    hops.push(cur);
  }
  return { ok: false, reason: "timeout", hops };
}

/** Un écho ICMP aller-retour : le chemin retour doit lui aussi exister. */
export function pingOnce(net: NetState, src: string, dst: string): TraceResult {
  const fwd = traceIp(net, src, dst);
  if (!fwd.ok) return fwd;
  const back = traceIp(net, fwd.endDevice!, fwd.srcIp!);
  if (!back.ok) return { ok: false, reason: "timeout", hops: fwd.hops };
  return fwd;
}
