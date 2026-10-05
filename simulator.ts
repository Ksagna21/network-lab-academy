// Simulateur multi-équipements : sessions CLI, commandes IOS, ping, sauvegarde / restauration.
import {
  runningConfig,
  runningConfigLines,
  showInterface,
  showInterfacesTrunk,
  showIpInterfaceBrief,
  showIpRoute,
  showOspfNeighbor,
  showVlanBrief,
} from "./config";
import { inSubnet, isValidIp, networkOf, wildcardToMask } from "./ip";
import {
  defaultInterfaceNames,
  ifaceKind,
  makeInterface,
  normalizeIfName,
  parseVlanList,
} from "./interfaces";
import { ifaceStatus, ownsIp, parseEndpoint, pingOnce, type TraceResult } from "./network";
import { CommandDef, completeToken, nextTokens, resolve, tokenize, type Tok } from "./parser";
import type { CliMode, DeviceState, NetState, Session, TopologyDef } from "./types";

class CliError extends Error {
  constructor(
    public kind: "invalid" | "msg",
    public index = 0,
    public text = "",
  ) {
    super(text || "invalid");
  }
}
const invalidAt = (index: number) => new CliError("invalid", index);
const msg = (text: string) => new CliError("msg", 0, text);

interface Ctx {
  sim: NetworkSimulator;
  net: NetState;
  dev: DeviceState;
  s: Session;
}

export interface ExecResult {
  output: string;
  mode: CliMode;
  prompt: string;
  /** true si la commande a été rejetée (syntaxe, mode, valeur invalide). */
  error: boolean;
}

export interface Snapshot {
  devices: Record<string, DeviceState>;
}

const EXEC: CliMode[] = ["user", "privileged"];
const CONFIG_SUB: CliMode[] = ["config-if", "config-router", "config-line", "config-vlan"];
const ROUTER: ("router" | "switch" | "pc")[] = ["router"];
const SWITCH: ("router" | "switch" | "pc")[] = ["switch"];

function iosPing(dev: DeviceState, dst: string, r: TraceResult): string {
  const ch = r.ok ? "!" : r.reason === "no-route" ? "U" : ".";
  const ok = r.ok ? 5 : 0;
  const L = [
    "Type escape sequence to abort.",
    `Sending 5, 100-byte ICMP Echos to ${dst}, timeout is 2 seconds:`,
    ch.repeat(5),
    `Success rate is ${r.ok ? 100 : 0} percent (${ok}/5)${r.ok ? ", round-trip min/avg/max = 1/2/4 ms" : ""}`,
  ];
  return L.join("\n");
}

function pcPing(dst: string, r: TraceResult): string {
  const L = [`Pinging ${dst} with 32 bytes of data:`, ""];
  for (let i = 0; i < 4; i++) {
    L.push(
      r.ok
        ? `Reply from ${dst}: bytes=32 time<1ms TTL=128`
        : r.reason === "no-route"
          ? "Destination host unreachable."
          : "Request timed out.",
    );
  }
  const got = r.ok ? 4 : 0;
  L.push("", `Ping statistics for ${dst}:`, `    Packets: Sent = 4, Received = ${got}, Lost = ${4 - got} (${r.ok ? 0 : 100}% loss)`);
  return L.join("\n");
}

function buildCommands(): CommandDef<Ctx>[] {
  const d: CommandDef<Ctx>[] = [];
  const add = (
    pattern: string,
    modes: CliMode[],
    run: CommandDef<Ctx>["run"],
    opts: { types?: CommandDef<Ctx>["types"]; help?: string } = {},
  ) => d.push({ pattern, modes, run, ...opts });

  // ── Navigation entre modes ──
  add("enable", ["user"], (c) => void (c.s.mode = "privileged"), { help: "Turn on privileged commands" });
  add("disable", ["privileged"], (c) => void (c.s.mode = "user"), { help: "Turn off privileged commands" });
  add("exit", ["privileged"], (c) => void (c.s.mode = "user"), { help: "Exit from the EXEC" });
  add("exit", ["user"], () => {}, { help: "Exit from the EXEC" });
  add(
    "configure terminal",
    ["privileged"],
    (c) => {
      c.s.mode = "config";
      return "Enter configuration commands, one per line.  End with CNTL/Z.";
    },
    { help: "Configure from the terminal" },
  );
  add("exit", ["config"], (c) => void (c.s.mode = "privileged"), { help: "Exit from configure mode" });
  add("exit", CONFIG_SUB, (c) => void (c.s.mode = "config"), { help: "Exit from current mode" });
  add("end", ["config", ...CONFIG_SUB], (c) => void (c.s.mode = "privileged"), { help: "Exit from configure mode" });

  // ── Exec : show ──
  const priv = (c: Ctx) => {
    if (c.s.mode === "user") throw msg("% Invalid input detected: privileged command");
  };
  add("show running-config", EXEC, (c) => (priv(c), runningConfig(c.dev)), { help: "Current operating configuration" });
  add(
    "show startup-config",
    EXEC,
    (c) => (priv(c), c.dev.startupConfig ?? "startup-config is not present"),
    { help: "Contents of startup configuration" },
  );
  add("show ip interface brief", EXEC, (c) => showIpInterfaceBrief(c.net, c.dev), { help: "Brief summary of IP status and configuration" });
  add("show ip route", EXEC, (c) => showIpRoute(c.net, c.dev), { types: ROUTER, help: "IP routing table" });
  add("show ip ospf neighbor", EXEC, (c) => showOspfNeighbor(c.net, c.dev), { types: ROUTER, help: "Neighbor list" });
  add("show vlan brief", EXEC, (c) => showVlanBrief(c.dev), { types: SWITCH, help: "VTP all VLAN status in brief" });
  add("show interfaces trunk", EXEC, (c) => showInterfacesTrunk(c.net, c.dev), { types: SWITCH, help: "Interface trunk information" });
  add(
    "show interfaces <iface>",
    EXEC,
    (c, t) => showInterface(c.net, c.dev, resolveIface(c, t[2], 2)),
    { help: "Interface name" },
  );
  add(
    "show interfaces <ifword> <ifnum>",
    EXEC,
    (c, t) => showInterface(c.net, c.dev, resolveIface(c, `${t[2]}${t[3]}`, 2)),
    { help: "Interface number" },
  );
  add("show version", EXEC, (c) => `NetAcademy IOS Simulator, device ${c.dev.hostname}\nSimulated device — not a real Cisco IOS image.`, {
    help: "System hardware and software status",
  });
  add("ping <ip>", EXEC, (c, t) => iosPing(c.dev, t[1], pingOnce(c.net, c.dev.id, t[1])), { help: "Send echo messages" });
  const save = (c: Ctx) => {
    priv(c);
    c.dev.startupConfig = runningConfigLines(c.dev).join("\n");
    return "Building configuration...\n[OK]";
  };
  add("copy running-config startup-config", EXEC, save, { help: "Copy to startup-config" });
  add("write memory", EXEC, save, { help: "Write to NV memory" });
  add("write", EXEC, save, { help: "Write running configuration to memory" });

  // ── Configuration globale ──
  add("hostname <text>", ["config"], (c, t) => void (c.dev.hostname = t[1]), { help: "Set system's network name" });
  const enterIface = (c: Ctx, raw: string, idx: number) => {
    const name = normalizeIfName(raw);
    if (!name) throw invalidAt(idx);
    const kind = ifaceKind(name);
    if (!c.dev.interfaces[name]) {
      const okCreate =
        (kind === "loopback" && c.dev.type === "router") || (kind === "svi" && c.dev.type === "switch");
      if (!okCreate) throw invalidAt(idx);
      c.dev.interfaces[name] = makeInterface(name, c.dev.type);
      if (kind === "svi") c.dev.interfaces[name].shutdown = false;
    }
    c.s.mode = "config-if";
    c.s.iface = name;
  };
  add("interface <iface>", ["config"], (c, t) => enterIface(c, t[1], 1), { help: "Interface name" });
  add("interface <ifword> <ifnum>", ["config"], (c, t) => enterIface(c, `${t[1]}${t[2]}`, 1), { help: "Interface number" });
  add("vlan <num>", ["config"], (c, t) => {
    const id = Number(t[1]);
    if (id < 1 || id > 4094) throw invalidAt(1);
    c.dev.vlans[id] ??= { id, name: `VLAN${String(id).padStart(4, "0")}` };
    c.s.mode = "config-vlan";
    c.s.vlan = id;
  }, { types: SWITCH, help: "ISL VLAN IDs 1-4094" });
  add("no vlan <num>", ["config"], (c, t) => {
    if (Number(t[2]) === 1) throw msg("%Default VLAN 1 may not be deleted.");
    delete c.dev.vlans[Number(t[2])];
  }, { types: SWITCH, help: "ISL VLAN IDs 1-4094" });
  add("ip route <ip> <mask> <ip>", ["config"], (c, t) => {
    if (networkOf(t[2], t[3]) !== t[2]) throw msg("%Inconsistent address and mask");
    const exists = c.dev.staticRoutes.some((r) => r.network === t[2] && r.mask === t[3] && r.nextHop === t[4]);
    if (!exists) c.dev.staticRoutes.push({ network: t[2], mask: t[3], nextHop: t[4] });
  }, { types: ROUTER, help: "Forwarding router's address" });
  add("no ip route <ip> <mask> <ip>", ["config"], (c, t) => {
    c.dev.staticRoutes = c.dev.staticRoutes.filter((r) => !(r.network === t[3] && r.mask === t[4] && r.nextHop === t[5]));
  }, { types: ROUTER, help: "Forwarding router's address" });
  add("ip default-gateway <ip>", ["config"], (c, t) => void (c.dev.defaultGateway = t[2]), { types: SWITCH, help: "Specify default gateway" });
  add("no ip domain-lookup", ["config"], () => {}, { help: "Disable IP Domain Name System hostname translation" });
  add("router ospf <num>", ["config"], (c, t) => {
    const pid = Number(t[2]);
    if (c.dev.ospf && c.dev.ospf.pid !== pid) throw msg("% Only one OSPF process is supported in this simulator.");
    c.dev.ospf ??= { pid, networks: [] };
    c.s.mode = "config-router";
  }, { types: ROUTER, help: "Process ID" });
  add("no router ospf <num>", ["config"], (c) => void (c.dev.ospf = undefined), { types: ROUTER, help: "Process ID" });
  add("line console <num>", ["config"], (c) => void (c.s.mode = "config-line"), { help: "Primary terminal line" });
  add("line vty <num> <num>", ["config"], (c) => void (c.s.mode = "config-line"), { help: "Last Line number" });

  // ── Interface ──
  const cur = (c: Ctx) => c.dev.interfaces[c.s.iface!];
  const flapMsgs = (c: Ctx, wasUp: boolean): string => {
    const n = c.s.iface!;
    const st = ifaceStatus(c.net, c.dev.id, n);
    const up = st.status === "up" && st.protocol === "up";
    if (cur(c).shutdown && wasUp)
      return `%LINK-5-CHANGED: Interface ${n}, changed state to administratively down\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to down`;
    if (!cur(c).shutdown && up && !wasUp)
      return `%LINK-3-UPDOWN: Interface ${n}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to up`;
    return "";
  };
  const wasUp = (c: Ctx) => {
    const st = ifaceStatus(c.net, c.dev.id, c.s.iface!);
    return st.status === "up" && st.protocol === "up";
  };
  add("shutdown", ["config-if"], (c) => {
    const w = wasUp(c);
    cur(c).shutdown = true;
    return flapMsgs(c, w);
  }, { help: "Shutdown the selected interface" });
  add("no shutdown", ["config-if"], (c) => {
    const w = wasUp(c);
    cur(c).shutdown = false;
    c.net.version++;
    return flapMsgs(c, w);
  }, { help: "Shutdown the selected interface" });
  add("description <rest>", ["config-if"], (c, t) => void (cur(c).description = t.slice(1).join(" ")), { help: "Interface specific description" });
  add("no description", ["config-if"], (c) => void (cur(c).description = undefined), { help: "Interface specific description" });
  add("ip address <ip> <mask>", ["config-if"], (c, t) => {
    const i = cur(c);
    if (c.dev.type === "switch" && i.kind === "physical") throw invalidAt(0);
    const net_ = networkOf(t[2], t[3]);
    const clash = Object.values(c.dev.interfaces).find(
      (o) => o.name !== i.name && o.ip && o.mask && networkOf(o.ip, o.mask) === net_ && o.mask === t[3],
    );
    if (clash) throw msg(`% ${net_} overlaps with ${clash.name}`);
    i.ip = t[2];
    i.mask = t[3];
  }, { help: "Set the IP address of an interface" });
  add("no ip address", ["config-if"], (c) => {
    cur(c).ip = undefined;
    cur(c).mask = undefined;
  }, { help: "Remove the IP address of an interface" });
  add("ip ospf cost <num>", ["config-if"], (c, t) => void (cur(c).ospfCost = Number(t[3])), { types: ROUTER, help: "Interface cost" });
  const l2 = (c: Ctx) => {
    if (cur(c).kind !== "physical") throw invalidAt(0);
    return cur(c);
  };
  add("switchport mode access", ["config-if"], (c) => {
    const i = l2(c);
    i.switchportMode = "access";
    i.modeExplicit = true;
  }, { types: SWITCH, help: "Set trunking mode to ACCESS unconditionally" });
  add("switchport mode trunk", ["config-if"], (c) => {
    const i = l2(c);
    i.switchportMode = "trunk";
    i.modeExplicit = true;
  }, { types: SWITCH, help: "Set trunking mode to TRUNK unconditionally" });
  add("switchport access vlan <num>", ["config-if"], (c, t) => {
    const i = l2(c);
    const id = Number(t[3]);
    if (id < 1 || id > 4094) throw invalidAt(3);
    let out = "";
    if (!c.dev.vlans[id]) {
      c.dev.vlans[id] = { id, name: `VLAN${String(id).padStart(4, "0")}` };
      out = `% Access VLAN does not exist. Creating vlan ${id}`;
    }
    i.accessVlan = id;
    return out;
  }, { types: SWITCH, help: "VLAN ID of the VLAN when this port is in access mode" });
  add("no switchport access vlan", ["config-if"], (c) => void (l2(c).accessVlan = 1), { types: SWITCH, help: "VLAN ID of the VLAN when this port is in access mode" });
  add("switchport trunk allowed vlan all", ["config-if"], (c) => void (l2(c).trunkAllowed = "all"), { types: SWITCH, help: "all VLANs" });
  add("switchport trunk allowed vlan add <vlanlist>", ["config-if"], (c, t) => {
    const i = l2(c);
    const list = parseVlanList(t[5]);
    if (!list) throw invalidAt(5);
    if (i.trunkAllowed !== "all") i.trunkAllowed = [...new Set([...i.trunkAllowed, ...list])];
  }, { types: SWITCH, help: "VLAN IDs of the allowed VLANs when this port is in trunking mode" });
  add("switchport trunk allowed vlan <vlanlist>", ["config-if"], (c, t) => {
    const i = l2(c);
    const list = parseVlanList(t[4]);
    if (!list) throw invalidAt(4);
    i.trunkAllowed = list;
  }, { types: SWITCH, help: "VLAN IDs of the allowed VLANs when this port is in trunking mode" });

  // ── OSPF ──
  add("network <ip> <wild> area <num>", ["config-router"], (c, t) => {
    const o = c.dev.ospf!;
    if (!o.networks.some((n) => n.network === t[1] && n.wildcard === t[2] && n.area === t[4]))
      o.networks.push({ network: t[1], wildcard: t[2], area: t[4] });
  }, { help: "Area ID" });
  add("no network <ip> <wild> area <num>", ["config-router"], (c, t) => {
    const o = c.dev.ospf!;
    o.networks = o.networks.filter((n) => !(n.network === t[2] && n.wildcard === t[3] && n.area === t[5]));
  }, { help: "Area ID" });
  add("router-id <ip>", ["config-router"], (c, t) => void (c.dev.ospf!.routerId = t[1]), { help: "OSPF router-id in IP address format" });

  // ── VLAN / lignes ──
  add("name <text>", ["config-vlan"], (c, t) => void (c.dev.vlans[c.s.vlan!].name = t[1]), { help: "The ascii name for the VLAN" });
  add("password <text>", ["config-line"], () => {}, { help: "Set a password" });
  add("login", ["config-line"], () => {}, { help: "Enable password checking" });
  add("logging synchronous", ["config-line"], () => {}, { help: "Synchronized message output" });
  add("exec-timeout <num> <num>", ["config-line"], () => {}, { help: "Set the EXEC timeout" });

  // ── Poste de travail (PC) ──
  add("ping <ip>", ["pc"], (c, t) => pcPing(t[1], pingOnce(c.net, c.dev.id, t[1])), { types: ["pc"], help: "Send echo messages" });
  add("ipconfig", ["pc"], (c) => {
    const i = Object.values(c.dev.interfaces)[0];
    return [
      `${i.name} Connection:(default port)`,
      "",
      `   IPv4 Address....................: ${i.ip ?? "0.0.0.0"}`,
      `   Subnet Mask.....................: ${i.mask ?? "0.0.0.0"}`,
      `   Default Gateway.................: ${c.dev.defaultGateway ?? "0.0.0.0"}`,
    ].join("\n");
  }, { types: ["pc"], help: "Display IP configuration" });
  add("ip address <ip> <mask> <ip>", ["pc"], (c, t) => {
    const i = Object.values(c.dev.interfaces)[0];
    i.ip = t[2];
    i.mask = t[3];
    c.dev.defaultGateway = t[4];
  }, { types: ["pc"], help: "Default gateway" });
  add("ip address <ip> <mask>", ["pc"], (c, t) => {
    const i = Object.values(c.dev.interfaces)[0];
    i.ip = t[2];
    i.mask = t[3];
    c.dev.defaultGateway = undefined;
  }, { types: ["pc"], help: "Subnet mask" });
  return d;
}

function resolveIface(c: Ctx, raw: string, idx: number): string {
  const n = normalizeIfName(raw);
  if (!n || !c.dev.interfaces[n]) throw invalidAt(idx);
  return n;
}

const COMMANDS = buildCommands();

export class NetworkSimulator {
  net: NetState;
  private sessions: Record<string, Session> = {};
  private lastError = false;

  constructor(def: TopologyDef, initialConfigs: Record<string, string[]> = {}) {
    const devices: Record<string, DeviceState> = {};
    def.devices.forEach((dd, idx) => {
      const dev: DeviceState = {
        id: dd.id,
        type: dd.type,
        hostname: dd.hostname ?? dd.id,
        label: dd.label,
        x: dd.x ?? 100 + idx * 150,
        y: dd.y ?? 100,
        interfaces: {},
        vlans: dd.type === "switch" ? { 1: { id: 1, name: "default" } } : {},
        staticRoutes: [],
      };
      for (const n of defaultInterfaceNames(dd.type)) dev.interfaces[n] = makeInterface(n, dd.type);
      if (dd.type === "switch") dev.interfaces["Vlan1"] = makeInterface("Vlan1", "switch");
      devices[dd.id] = dev;
    });
    const links = def.links.map((l) => {
      const a = parseEndpoint(l.a);
      const b = parseEndpoint(l.b);
      for (const e of [a, b]) {
        if (!devices[e.device]?.interfaces[e.iface]) throw new Error(`Lien invalide : ${e.device}:${e.iface} n'existe pas`);
      }
      return { a, b };
    });
    this.net = { devices, links, version: 0 };
    for (const id of Object.keys(devices)) this.sessions[id] = { mode: this.baseMode(id) };

    for (const [id, lines] of Object.entries(initialConfigs)) {
      if (!devices[id]) throw new Error(`Configuration initiale pour un équipement inconnu : ${id}`);
      this.sessions[id].mode = devices[id].type === "pc" ? "pc" : "config";
      for (const line of lines) {
        const r = this.execute(id, line);
        if (r.error) {
          throw new Error(`Configuration initiale invalide sur ${id} : "${line}" → ${r.output.replace(/\n/g, " | ")}`);
        }
      }
      this.sessions[id] = { mode: this.baseMode(id) };
      devices[id].startupConfig = runningConfigLines(devices[id]).join("\n");
    }
  }

  private baseMode(id: string): CliMode {
    return this.net.devices[id].type === "pc" ? "pc" : "user";
  }

  deviceIds(): string[] {
    return Object.keys(this.net.devices);
  }

  getDevice(id: string): DeviceState {
    return this.net.devices[id];
  }

  getMode(id: string): CliMode {
    return this.sessions[id].mode;
  }

  getPrompt(id: string): string {
    const h = this.net.devices[id].hostname;
    switch (this.sessions[id].mode) {
      case "user":
      case "pc":
        return `${h}>`;
      case "privileged":
        return `${h}#`;
      case "config":
        return `${h}(config)#`;
      case "config-if":
        return `${h}(config-if)#`;
      case "config-line":
        return `${h}(config-line)#`;
      case "config-router":
        return `${h}(config-router)#`;
      case "config-vlan":
        return `${h}(config-vlan)#`;
    }
  }

  private defsFor(id: string, mode: CliMode): CommandDef<Ctx>[] {
    const type = this.net.devices[id].type;
    return COMMANDS.filter((c) => c.modes.includes(mode) && (c.types ?? ["router", "switch"]).includes(type));
  }

  private ctx(id: string): Ctx {
    return { sim: this, net: this.net, dev: this.net.devices[id], s: this.sessions[id] };
  }

  private fail(prompt: string, toks: Tok[], index: number, kind: "invalid" | "incomplete" | "ambiguous"): string {
    if (kind === "incomplete") return "% Incomplete command.";
    if (kind === "ambiguous") return `% Ambiguous command:  "${toks[index].text}"`;
    const col = (toks[Math.min(index, toks.length - 1)]?.col ?? 0) + prompt.length;
    return `${" ".repeat(col)}^\n% Invalid input detected at '^' marker.`;
  }

  execute(id: string, line: string): ExecResult {
    const s = this.sessions[id];
    const promptBefore = this.getPrompt(id);
    const toks = tokenize(line);
    let output = "";
    this.lastError = false;

    if (toks.length) {
      let mode = s.mode;
      let words = toks;
      let restoreMode: CliMode | null = null;
      if (mode.startsWith("config") && toks[0].text.toLowerCase() === "do" && toks.length > 1) {
        restoreMode = mode;
        mode = "privileged";
        words = toks.slice(1);
        s.mode = "privileged";
      }
      try {
        output = this.run(id, mode, words, promptBefore) ?? "";
      } catch (e) {
        if (e instanceof CliError) {
          this.lastError = true;
          output =
            e.kind === "msg" ? e.text : this.fail(promptBefore, words, e.index, "invalid");
        } else throw e;
      } finally {
        if (restoreMode) s.mode = restoreMode;
      }
    }
    this.net.version++;
    return { output, mode: s.mode, prompt: this.getPrompt(id), error: this.lastError };
  }

  private run(id: string, mode: CliMode, words: Tok[], prompt: string): string | undefined {
    const input = words.map((w) => w.text);
    let r = resolve(this.defsFor(id, mode), input);
    let fallbackToConfig = false;
    if (r.kind === "invalid" && CONFIG_SUB.includes(mode)) {
      const g = resolve(this.defsFor(id, "config"), input);
      if (g.kind === "run") {
        r = g;
        fallbackToConfig = true;
      }
    }
    if (r.kind !== "run") {
      this.lastError = true;
      return this.fail(prompt, words, r.kind === "incomplete" ? 0 : r.index, r.kind);
    }
    if (fallbackToConfig) this.sessions[id].mode = "config";
    return r.def.run(this.ctx(id), input) as string | undefined;
  }

  /** Aide contextuelle : texte affiché quand l'utilisateur tape « ? ». */
  help(id: string, line: string): string {
    const mode = this.sessions[id].mode;
    const defs = [
      ...this.defsFor(id, mode),
      ...(CONFIG_SUB.includes(mode) ? this.defsFor(id, "config") : []),
    ];
    const trimmed = line.trimEnd();
    const input = tokenize(trimmed).map((t) => t.text);
    const partial = trimmed.length > 0 && !/\s$/.test(line);
    const next = nextTokens(defs, input, partial);
    if (!next.length) return "% Unrecognized command";
    if (partial) return next.map((n) => n.token).join("  ");
    return next.map((n) => `  ${n.token.padEnd(16)}${n.help}`.trimEnd()).join("\n");
  }

  complete(id: string, line: string): string {
    const mode = this.sessions[id].mode;
    const defs = [
      ...this.defsFor(id, mode),
      ...(CONFIG_SUB.includes(mode) ? this.defsFor(id, "config") : []),
    ];
    return completeToken(defs, line);
  }

  /** Test de connectivité entre un équipement et une adresse IP. */
  ping(from: string, toIp: string): boolean {
    if (!isValidIp(toIp)) return false;
    return pingOnce(this.net, from, toIp).ok;
  }

  runningConfigLines(id: string): string[] {
    return runningConfigLines(this.net.devices[id]);
  }

  snapshot(): Snapshot {
    return { devices: JSON.parse(JSON.stringify(this.net.devices)) };
  }

  restore(snap: Snapshot): void {
    this.net.devices = JSON.parse(JSON.stringify(snap.devices));
    this.net.version++;
    for (const id of Object.keys(this.net.devices)) this.sessions[id] = { mode: this.baseMode(id) };
  }
}

export { inSubnet, ownsIp, wildcardToMask };
