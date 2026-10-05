export type DeviceType = "router" | "switch" | "pc";

export type CliMode =
  | "user"
  | "privileged"
  | "config"
  | "config-if"
  | "config-line"
  | "config-router"
  | "config-vlan"
  | "pc";

export interface InterfaceState {
  name: string;
  kind: "physical" | "loopback" | "svi";
  ip?: string;
  mask?: string;
  shutdown: boolean;
  description?: string;
  /** Couche 2 (switchs uniquement) */
  switchportMode: "access" | "trunk";
  modeExplicit?: boolean;
  accessVlan: number;
  trunkAllowed: number[] | "all";
  ospfCost?: number;
}

export interface StaticRoute {
  network: string;
  mask: string;
  nextHop: string;
}

export interface OspfNetwork {
  network: string;
  wildcard: string;
  area: string;
}

export interface OspfProcess {
  pid: number;
  routerId?: string;
  networks: OspfNetwork[];
}

export interface VlanState {
  id: number;
  name: string;
}

export interface DeviceState {
  id: string;
  type: DeviceType;
  hostname: string;
  label?: string;
  x: number;
  y: number;
  interfaces: Record<string, InterfaceState>;
  vlans: Record<number, VlanState>;
  staticRoutes: StaticRoute[];
  ospf?: OspfProcess;
  defaultGateway?: string;
  startupConfig?: string;
}

export interface Endpoint {
  device: string;
  iface: string;
}

export interface Link {
  a: Endpoint;
  b: Endpoint;
}

export interface NetState {
  devices: Record<string, DeviceState>;
  links: Link[];
  /** Incrémenté à chaque commande ; sert à invalider les caches de calcul. */
  version: number;
}

/** Définition de topologie telle qu'écrite dans les fichiers de lab. */
export interface TopologyDef {
  devices: { id: string; type: DeviceType; hostname?: string; label?: string; x?: number; y?: number }[];
  /** Extrémités au format "R1:Gi0/0" */
  links: { a: string; b: string }[];
}

export interface Session {
  mode: CliMode;
  iface?: string;
  vlan?: number;
}
