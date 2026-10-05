// Génération de la configuration (running-config) et des sorties « show ».
import { compressVlans, shortIfName } from "./interfaces";
import { ifaceStatus, ospfAdjacencies, routesOf, routerIdOf } from "./network";
import type { DeviceState, NetState } from "./types";
import { maskToPrefix } from "./ip";
import { ipToInt } from "./ip";

export function runningConfigLines(dev: DeviceState): string[] {
  const L: string[] = ["version 15.2", "!", `hostname ${dev.hostname}`, "!"];
  if (dev.type === "switch") {
    for (const v of Object.values(dev.vlans).filter((v) => v.id !== 1)) {
      L.push(`vlan ${v.id}`, ` name ${v.name}`, "!");
    }
  }
  for (const i of Object.values(dev.interfaces)) {
    L.push(`interface ${i.name}`);
    if (i.description) L.push(` description ${i.description}`);
    if (dev.type === "switch" && i.kind === "physical") {
      if (i.modeExplicit || i.switchportMode === "trunk") L.push(` switchport mode ${i.switchportMode}`);
      if (i.accessVlan !== 1) L.push(` switchport access vlan ${i.accessVlan}`);
      if (i.trunkAllowed !== "all") L.push(` switchport trunk allowed vlan ${compressVlans(i.trunkAllowed)}`);
    } else if (i.ip && i.mask) {
      L.push(` ip address ${i.ip} ${i.mask}`);
    } else {
      L.push(" no ip address");
    }
    if (i.ospfCost !== undefined) L.push(` ip ospf cost ${i.ospfCost}`);
    if (i.shutdown) L.push(" shutdown");
    L.push("!");
  }
  if (dev.ospf) {
    L.push(`router ospf ${dev.ospf.pid}`);
    if (dev.ospf.routerId) L.push(` router-id ${dev.ospf.routerId}`);
    for (const n of dev.ospf.networks) L.push(` network ${n.network} ${n.wildcard} area ${n.area}`);
    L.push("!");
  }
  for (const r of dev.staticRoutes) L.push(`ip route ${r.network} ${r.mask} ${r.nextHop}`);
  if (dev.defaultGateway) L.push(`ip default-gateway ${dev.defaultGateway}`);
  if (dev.staticRoutes.length || dev.defaultGateway) L.push("!");
  L.push("end");
  return L;
}

export function runningConfig(dev: DeviceState): string {
  const body = runningConfigLines(dev).join("\n");
  return `Building configuration...\n\nCurrent configuration : ${body.length} bytes\n!\n${body}`;
}

export function showIpInterfaceBrief(net: NetState, dev: DeviceState): string {
  const head =
    "Interface".padEnd(23) + "IP-Address".padEnd(16) + "OK? " + "Method ".padEnd(7 + 1) + "Status".padEnd(22) + "Protocol";
  const rows = Object.values(dev.interfaces).map((i) => {
    const st = ifaceStatus(net, dev.id, i.name);
    return (
      i.name.padEnd(23) +
      (i.ip ?? "unassigned").padEnd(16) +
      "YES " +
      (i.ip ? "manual" : "unset").padEnd(7) +
      " " +
      st.status.padEnd(22) +
      st.protocol
    );
  });
  return [head, ...rows].join("\n");
}

export function showVlanBrief(dev: DeviceState): string {
  const head = "VLAN " + "Name".padEnd(33) + "Status".padEnd(10) + "Ports";
  const sep = `---- ${"-".repeat(32)} ${"-".repeat(9)} ${"-".repeat(31)}`;
  const ids = Object.keys(dev.vlans).map(Number).sort((a, b) => a - b);
  const out = [head, sep];
  for (const id of ids) {
    const ports = Object.values(dev.interfaces)
      .filter((i) => i.kind === "physical" && i.switchportMode === "access" && i.accessVlan === id)
      .map((i) => shortIfName(i.name));
    const lines: string[] = [];
    let cur = "";
    for (const p of ports) {
      const next = cur ? `${cur}, ${p}` : p;
      if (next.length > 31 && cur) {
        lines.push(`${cur},`);
        cur = p;
      } else cur = next;
    }
    lines.push(cur);
    out.push(`${String(id).padEnd(5)}${dev.vlans[id].name.padEnd(33)}${"active".padEnd(10)}${lines[0]}`);
    for (const l of lines.slice(1)) out.push(" ".repeat(48) + l);
  }
  out.push(
    "1002 fddi-default                     act/unsup",
    "1003 token-ring-default               act/unsup",
    "1004 fddinet-default                  act/unsup",
    "1005 trnet-default                    act/unsup",
  );
  return out.join("\n");
}

export function showInterfacesTrunk(net: NetState, dev: DeviceState): string {
  const trunks = Object.values(dev.interfaces).filter((i) => i.kind === "physical" && i.switchportMode === "trunk");
  if (!trunks.length) return "";
  const a = ["Port".padEnd(12) + "Mode".padEnd(13) + "Encapsulation".padEnd(15) + "Status".padEnd(14) + "Native vlan"];
  const b = ["Port".padEnd(12) + "Vlans allowed on trunk"];
  for (const t of trunks) {
    const up = ifaceStatus(net, dev.id, t.name).protocol === "up";
    a.push(shortIfName(t.name).padEnd(12) + "on".padEnd(13) + "802.1q".padEnd(15) + (up ? "trunking" : "not-trunking").padEnd(14) + "1");
    b.push(shortIfName(t.name).padEnd(12) + (t.trunkAllowed === "all" ? "1-4094" : compressVlans(t.trunkAllowed)));
  }
  return `${a.join("\n")}\n\n${b.join("\n")}`;
}

export function showIpRoute(net: NetState, dev: DeviceState): string {
  const routes = routesOf(net, dev.id).sort((x, y) => ipToInt(x.network) - ipToInt(y.network) || x.prefix - y.prefix);
  const def = routes.find((r) => r.prefix === 0 && r.nextHop);
  const L = [
    "Codes: C - connected, S - static, O - OSPF, * - candidate default",
    "",
    def ? `Gateway of last resort is ${def.nextHop} to network 0.0.0.0` : "Gateway of last resort is not set",
    "",
  ];
  for (const r of routes) {
    const net_ = `${r.network}/${maskToPrefix(r.mask)}`;
    if (r.protocol === "connected") L.push(`C        ${net_} is directly connected, ${r.iface}`);
    else if (r.protocol === "static")
      L.push(`S${r.prefix === 0 ? "*" : " "}       ${net_} [1/0] via ${r.nextHop}`);
    else L.push(`O        ${net_} [110/${r.metric}] via ${r.nextHop}, 00:00:30, ${r.iface}`);
  }
  return L.join("\n");
}

export function showOspfNeighbor(net: NetState, dev: DeviceState): string {
  const adj = ospfAdjacencies(net, dev.id);
  if (!adj.length) return "";
  const head =
    "Neighbor ID".padEnd(16) + "Pri".padEnd(6) + "State".padEnd(16) + "Dead Time".padEnd(12) + "Address".padEnd(16) + "Interface";
  const rows = adj.map(
    (a) =>
      a.neighborId.padEnd(16) +
      "1".padStart(3).padEnd(6) +
      (a.neighborIsDr ? "FULL/DR" : "FULL/BDR").padEnd(16) +
      "00:00:34".padEnd(12) +
      a.neighborIp.padEnd(16) +
      a.iface,
  );
  return [head, ...rows].join("\n");
}

export function showInterface(net: NetState, dev: DeviceState, name: string): string {
  const i = dev.interfaces[name];
  const st = ifaceStatus(net, dev.id, name);
  const L = [`${name} is ${st.status}, line protocol is ${st.protocol}`];
  if (i.description) L.push(`  Description: ${i.description}`);
  if (i.ip && i.mask) L.push(`  Internet address is ${i.ip}/${maskToPrefix(i.mask)}`);
  L.push("  MTU 1500 bytes");
  return L.join("\n");
}

export { routerIdOf };
