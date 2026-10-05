// Analyse de commandes façon IOS : abréviations, aide « ? », complétion Tab, erreurs avec marqueur ^.
import { isValidIp, isValidMask, isValidWildcard } from "./ip";
import { normalizeIfName } from "./interfaces";
import type { CliMode, DeviceType } from "./types";

export interface Tok {
  text: string;
  col: number;
}

export function tokenize(line: string): Tok[] {
  const out: Tok[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push({ text: m[0], col: m.index });
  return out;
}

export interface CommandDef<C> {
  /** Ex. "show ip route", "ip address <ip> <mask>". <rest> absorbe la fin de ligne. */
  pattern: string;
  modes: CliMode[];
  /** Types d'équipement concernés (défaut : routeur + switch). */
  types?: DeviceType[];
  /** Description du dernier mot, affichée par « ? ». */
  help?: string;
  run: (ctx: C, t: string[]) => string | void;
}

export function validateParam(kind: string, tok: string): boolean {
  switch (kind) {
    case "<ip>":
      return isValidIp(tok);
    case "<mask>":
      return isValidMask(tok);
    case "<wild>":
      return isValidWildcard(tok);
    case "<num>":
      return /^\d+$/.test(tok);
    case "<vlanlist>":
      return /^\d+(?:[,-]\d+)*$/.test(tok);
    case "<iface>":
      return normalizeIfName(tok) !== null;
    case "<ifword>":
      return /^[a-z]+$/i.test(tok) && normalizeIfName(`${tok}0`) !== null;
    case "<ifnum>":
      return /^\d+(?:\/\d+)*$/.test(tok);
    default:
      return true; // <text>, <rest>
  }
}

type MatchResult = { ok: true; exact: boolean; complete: boolean } | { ok: false; at: number };

function matchOne(toks: string[], input: string[]): MatchResult {
  let exact = true;
  for (let i = 0; i < input.length; i++) {
    const p = toks[i];
    if (p === undefined) return { ok: false, at: i };
    if (p === "<rest>") return { ok: true, exact, complete: true };
    if (p.startsWith("<")) {
      if (!validateParam(p, input[i])) return { ok: false, at: i };
      continue;
    }
    const t = input[i].toLowerCase();
    if (t === p) continue;
    if (p.startsWith(t)) {
      exact = false;
      continue;
    }
    return { ok: false, at: i };
  }
  return { ok: true, exact, complete: input.length === toks.length };
}

export type Resolution<C> =
  | { kind: "run"; def: CommandDef<C> }
  | { kind: "invalid"; index: number }
  | { kind: "incomplete" }
  | { kind: "ambiguous"; index: number };

export function resolve<C>(defs: CommandDef<C>[], input: string[]): Resolution<C> {
  let furthest = 0;
  let hits: { def: CommandDef<C>; toks: string[]; exact: boolean; complete: boolean }[] = [];
  for (const def of defs) {
    const toks = def.pattern.split(" ");
    const r = matchOne(toks, input);
    if (r.ok) hits.push({ def, toks, exact: r.exact, complete: r.complete });
    else furthest = Math.max(furthest, (r as { at: number }).at);
  }
  if (!hits.length) return { kind: "invalid", index: furthest };

  const exacts = hits.filter((h) => h.exact);
  if (exacts.length) hits = exacts;

  if (hits.length > 1) {
    for (let i = 0; i < input.length; i++) {
      const lits = new Set(hits.map((h) => h.toks[i] ?? "").filter((t) => t && !t.startsWith("<")));
      if (lits.size > 1) return { kind: "ambiguous", index: i };
    }
  }
  const complete = hits.find((h) => h.complete);
  return complete ? { kind: "run", def: complete.def } : { kind: "incomplete" };
}

const PARAM_LABEL: Record<string, string> = {
  "<ip>": "A.B.C.D",
  "<mask>": "A.B.C.D",
  "<wild>": "A.B.C.D",
  "<num>": "<number>",
  "<text>": "WORD",
  "<rest>": "LINE",
  "<iface>": "<interface>",
  "<ifword>": "<interface-type>",
  "<ifnum>": "<number>",
  "<vlanlist>": "WORD",
};

const TOKEN_HELP: Record<string, string> = {
  show: "Show running system information",
  ip: "IP information",
  interface: "Select an interface to configure",
  interfaces: "Interface status and configuration",
  no: "Negate a command or set its defaults",
  switchport: "Set switching mode characteristics",
  mode: "Set trunking mode of the interface",
  access: "Set access mode characteristics of the interface",
  trunk: "Set trunking characteristics of the interface",
  allowed: "Set allowed VLAN characteristics when interface is in trunking mode",
  vlan: "VLAN information",
  router: "Enable a routing process",
  ospf: "Open Shortest Path First (OSPF)",
  line: "Configure a terminal line",
  copy: "Copy from one file to another",
  "running-config": "Current operating configuration",
  "startup-config": "Contents of startup configuration",
  configure: "Enter configuration mode",
  write: "Write running configuration to memory",
};

export interface NextToken {
  token: string;
  help: string;
}

export function nextTokens<C>(defs: CommandDef<C>[], input: string[], partial: boolean): NextToken[] {
  const prefix = partial ? input.slice(0, -1) : input;
  const n = prefix.length;
  const last = partial ? input[input.length - 1].toLowerCase() : "";
  const out = new Map<string, string>();
  for (const def of defs) {
    const toks = def.pattern.split(" ");
    if (!matchOne(toks, prefix).ok) continue;
    const t = toks[n];
    if (t === undefined) {
      if (!partial) out.set("<cr>", out.get("<cr>") ?? "");
      continue;
    }
    if (partial && (t.startsWith("<") || !t.startsWith(last))) continue;
    const label = t.startsWith("<") ? (PARAM_LABEL[t] ?? t) : t;
    const help = n === toks.length - 1 ? (def.help ?? "") : (TOKEN_HELP[t] ?? "");
    if (!out.get(label)) out.set(label, help);
  }
  return [...out.entries()]
    .map(([token, help]) => ({ token, help }))
    .sort((a, b) => (a.token === "<cr>" ? 1 : b.token === "<cr>" ? -1 : a.token.localeCompare(b.token)));
}

export function completeToken<C>(defs: CommandDef<C>[], line: string): string {
  if (!line.trim() || /\s$/.test(line)) return line;
  const toks = tokenize(line);
  const input = toks.map((t) => t.text);
  const n = input.length - 1;
  const last = input[n].toLowerCase();
  const lits = new Set<string>();
  for (const def of defs) {
    const p = def.pattern.split(" ");
    if (!matchOne(p, input.slice(0, -1)).ok) continue;
    const t = p[n];
    if (t && !t.startsWith("<") && t.startsWith(last)) lits.add(t);
  }
  if (lits.size !== 1) return line;
  const [word] = [...lits];
  return `${line.slice(0, toks[n].col)}${word} `;
}
