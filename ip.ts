// Utilitaires IPv4 purs (aucune dépendance UI)

export function isValidIp(s: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  return !!m && m.slice(1).every((o) => Number(o) <= 255);
}

export function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, o) => acc * 256 + Number(o), 0);
}

export function intToIp(n: number): string {
  return [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");
}

/** Masque de sous-réseau valide : uns contigus puis zéros. */
export function isValidMask(m: string): boolean {
  if (!isValidIp(m)) return false;
  const inv = ~ipToInt(m) >>> 0;
  return (inv & (inv + 1)) === 0;
}

/** Wildcard valide (inverse d'un masque) : zéros contigus puis uns. */
export function isValidWildcard(w: string): boolean {
  if (!isValidIp(w)) return false;
  const n = ipToInt(w);
  return (n & (n + 1)) === 0;
}

export function maskToPrefix(mask: string): number {
  return ipToInt(mask).toString(2).split("1").length - 1;
}

export function prefixToMask(prefix: number): string {
  if (prefix <= 0) return "0.0.0.0";
  return intToIp((0xffffffff << (32 - prefix)) >>> 0);
}

export function networkOf(ip: string, mask: string): string {
  return intToIp((ipToInt(ip) & ipToInt(mask)) >>> 0);
}

export function inSubnet(ip: string, network: string, mask: string): boolean {
  return networkOf(ip, mask) === network;
}

export function matchesWildcard(ip: string, network: string, wildcard: string): boolean {
  return (((ipToInt(ip) ^ ipToInt(network)) & ~ipToInt(wildcard)) >>> 0) === 0;
}

export function wildcardToMask(w: string): string {
  return intToIp((~ipToInt(w)) >>> 0);
}
