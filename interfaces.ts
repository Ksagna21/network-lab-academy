import type { DeviceType, InterfaceState } from "./types";

const FULL_NAMES = ["GigabitEthernet", "FastEthernet", "Ethernet", "Loopback", "Vlan"];

/** "gi0/0", "g0/0", "GigabitEthernet0/0" → "GigabitEthernet0/0". null si la syntaxe est invalide. */
export function normalizeIfName(raw: string): string | null {
  const m = /^([a-zA-Z]+)\s*(\d+(?:\/\d+)*)$/.exec(raw.trim());
  if (!m) return null;
  const word = m[1].toLowerCase();
  const full = FULL_NAMES.find((n) => n.toLowerCase().startsWith(word));
  return full ? `${full}${m[2]}` : null;
}

export function shortIfName(name: string): string {
  return name
    .replace("GigabitEthernet", "Gi")
    .replace("FastEthernet", "Fa")
    .replace("Ethernet", "Et")
    .replace("Loopback", "Lo")
    .replace("Vlan", "Vl");
}

export function ifaceKind(name: string): InterfaceState["kind"] {
  if (name.startsWith("Loopback")) return "loopback";
  if (name.startsWith("Vlan")) return "svi";
  return "physical";
}

export function makeInterface(name: string, type: DeviceType): InterfaceState {
  const kind = ifaceKind(name);
  return {
    name,
    kind,
    // Les interfaces de routeur sont désactivées par défaut ; Vlan1 aussi sur un switch.
    shutdown: kind === "physical" ? type === "router" : name === "Vlan1",
    switchportMode: "access",
    accessVlan: 1,
    trunkAllowed: "all",
  };
}

export function defaultInterfaceNames(type: DeviceType): string[] {
  if (type === "router") return ["GigabitEthernet0/0", "GigabitEthernet0/1", "GigabitEthernet0/2"];
  if (type === "pc") return ["FastEthernet0"];
  const fa = Array.from({ length: 24 }, (_, i) => `FastEthernet0/${i + 1}`);
  return [...fa, "GigabitEthernet0/1", "GigabitEthernet0/2"];
}

export function compressVlans(nums: number[]): string {
  const s = [...new Set(nums)].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(j > i ? `${s[i]}-${s[j]}` : `${s[i]}`);
    i = j + 1;
  }
  return out.join(",");
}

/** "10,20,30-32" → [10,20,30,31,32]. null si invalide. */
export function parseVlanList(text: string): number[] | null {
  const out: number[] = [];
  for (const part of text.split(",")) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b > 4094 || b < a) return null;
    for (let v = a; v <= b; v++) out.push(v);
  }
  return out;
}
