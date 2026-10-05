import { describe, expect, it } from "vitest";
import { evaluateCheck } from "./checks";
import { NetworkSimulator } from "./simulator";
import { ciscoLabs } from "@/labs";
import type { Lab } from "@/labs";

function load(lab: Lab) {
  return new NetworkSimulator(lab.topology, lab.initialConfigs);
}

/** Applique la solution : mode config pour routeurs/switchs, mode PC pour les postes. */
function applySolution(sim: NetworkSimulator, lab: Lab) {
  for (const [id, lines] of Object.entries(lab.solution)) {
    sim.execute(id, "enable");
    sim.execute(id, "configure terminal");
    for (const l of lines) sim.execute(id, l);
  }
}

const results = (sim: NetworkSimulator, lab: Lab) =>
  lab.objectives.map((o) => ({ id: o.id, ...evaluateCheck(sim, o.check) }));

describe("labs Cisco", () => {
  it("charge au moins 3 labs valides", () => {
    expect(ciscoLabs.length).toBeGreaterThanOrEqual(3);
  });

  for (const lab of ciscoLabs) {
    describe(lab.title, () => {
      it("démarre avec des objectifs non atteints", () => {
        const sim = load(lab);
        const done = results(sim, lab).filter((r) => r.ok);
        expect(done.map((d) => d.id)).toEqual([]);
      });

      it("est entièrement validé par la solution de référence", () => {
        const sim = load(lab);
        applySolution(sim, lab);
        const failing = results(sim, lab).filter((r) => !r.ok);
        expect(failing).toEqual([]);
      });
    });
  }
});

describe("analyse des commandes IOS", () => {
  const lab = ciscoLabs.find((l) => l.id === "cisco-interface-basics")!;
  const mk = () => load(lab);

  it("gère les modes et les prompts", () => {
    const sim = mk();
    expect(sim.getPrompt("R1")).toBe("Router>");
    sim.execute("R1", "en");
    expect(sim.getPrompt("R1")).toBe("Router#");
    sim.execute("R1", "conf t");
    expect(sim.getPrompt("R1")).toBe("Router(config)#");
    sim.execute("R1", "int g0/0");
    expect(sim.getPrompt("R1")).toBe("Router(config-if)#");
    sim.execute("R1", "exit");
    expect(sim.getPrompt("R1")).toBe("Router(config)#");
    sim.execute("R1", "hostname Edge");
    expect(sim.getPrompt("R1")).toBe("Edge(config)#");
    sim.execute("R1", "end");
    expect(sim.getPrompt("R1")).toBe("Edge#");
  });

  it("accepte les abréviations et signale les erreurs comme IOS", () => {
    const sim = mk();
    sim.execute("R1", "enable");
    expect(sim.execute("R1", "sh ip int br").output).toContain("GigabitEthernet0/0");
    expect(sim.execute("R1", "show ip").output).toBe("% Incomplete command.");
    expect(sim.execute("R1", "co").output).toBe('% Ambiguous command:  "co"');
    const bad = sim.execute("R1", "show iq route").output;
    expect(bad).toContain("% Invalid input detected at '^' marker.");
    // le marqueur ^ est aligné sous « iq » (prompt « Router# » = 7 car. + « show » + espace)
    expect(bad.split("\n")[0]).toBe(`${" ".repeat(7 + 5)}^`);
  });

  it("rejette une adresse ou un masque invalide", () => {
    const sim = mk();
    sim.execute("R1", "enable");
    sim.execute("R1", "conf t");
    sim.execute("R1", "int g0/0");
    expect(sim.execute("R1", "ip address 10.0.0.300 255.255.255.0").output).toContain("Invalid input");
    expect(sim.execute("R1", "ip address 10.0.0.1 255.0.255.0").output).toContain("Invalid input");
  });

  it("revient en mode global quand on tape une commande globale depuis une interface", () => {
    const sim = mk();
    sim.execute("R1", "enable");
    sim.execute("R1", "conf t");
    sim.execute("R1", "int g0/0");
    sim.execute("R1", "hostname X1");
    expect(sim.getPrompt("R1")).toBe("X1(config)#");
  });

  it("supporte « do » depuis le mode configuration", () => {
    const sim = mk();
    sim.execute("R1", "enable");
    sim.execute("R1", "conf t");
    expect(sim.execute("R1", "do show ip interface brief").output).toContain("administratively down");
    expect(sim.getPrompt("R1")).toBe("Router(config)#");
  });

  it("propose l'aide « ? » et la complétion Tab", () => {
    const sim = mk();
    sim.execute("R1", "enable");
    expect(sim.help("R1", "show ")).toContain("running-config");
    expect(sim.help("R1", "sh")).toContain("show");
    expect(sim.complete("R1", "conf")).toBe("configure ");
    expect(sim.complete("R1", "co")).toBe("co"); // ambigu : pas de complétion
  });

  it("n'autorise pas les commandes privilégiées en mode utilisateur", () => {
    const sim = mk();
    expect(sim.execute("R1", "show running-config").output).toContain("%");
  });

  it("signale un chevauchement d'adresses", () => {
    const sim = mk();
    sim.execute("R1", "enable");
    sim.execute("R1", "conf t");
    sim.execute("R1", "int g0/0");
    sim.execute("R1", "ip address 10.0.0.1 255.255.255.0");
    sim.execute("R1", "int g0/1");
    expect(sim.execute("R1", "ip address 10.0.0.9 255.255.255.0").output).toContain("overlaps with GigabitEthernet0/0");
  });

  it("affiche des messages de changement d'état à l'activation", () => {
    const sim = mk();
    sim.execute("R1", "enable");
    sim.execute("R1", "conf t");
    sim.execute("R1", "int g0/0");
    const out = sim.execute("R1", "no shutdown").output;
    expect(out).toContain("changed state to up");
  });

  it("restaure l'état initial", () => {
    const sim = mk();
    const snap = sim.snapshot();
    sim.execute("R1", "enable");
    sim.execute("R1", "conf t");
    sim.execute("R1", "hostname Autre");
    sim.restore(snap);
    expect(sim.getPrompt("R1")).toBe("Router>");
  });
});

describe("connectivité", () => {
  it("exige un chemin retour : sans route sur R2, le ping de PC1 échoue", () => {
    const lab = ciscoLabs.find((l) => l.id === "cisco-static-routing")!;
    const sim = load(lab);
    applySolution(sim, lab);
    expect(sim.ping("PC1", "192.168.2.10")).toBe(true);
    // on retire la route retour sur R2
    sim.execute("R2", "no ip route 192.168.1.0 255.255.255.0 10.0.0.1");
    expect(sim.ping("PC1", "192.168.2.10")).toBe(false);
  });

  it("une route vers un prochain saut injoignable n'est pas installée", () => {
    const lab = ciscoLabs.find((l) => l.id === "cisco-static-routing")!;
    const sim = load(lab);
    for (const l of ["enable", "conf t", "ip route 192.168.2.0 255.255.255.0 10.0.0.2", "end"]) sim.execute("R1", l);
    expect(sim.execute("R1", "show ip route").output).not.toContain("192.168.2.0");
  });

  it("un port trunk qui n'autorise pas le VLAN coupe la communication", () => {
    const lab = ciscoLabs.find((l) => l.id === "cisco-vlan-trunk")!;
    const sim = load(lab);
    applySolution(sim, lab);
    expect(sim.ping("PC1", "192.168.1.2")).toBe(true);
    sim.execute("SW1", "interface FastEthernet0/24");
    sim.execute("SW1", "switchport trunk allowed vlan 20");
    expect(sim.ping("PC1", "192.168.1.2")).toBe(false);
    expect(sim.ping("PC3", "192.168.1.4")).toBe(true);
  });

  it("OSPF : deux routeurs deviennent voisins et apprennent les réseaux", () => {
    const sim = new NetworkSimulator(
      {
        devices: [
          { id: "R1", type: "router" },
          { id: "R2", type: "router" },
          { id: "R3", type: "router" },
          { id: "PC1", type: "pc" },
          { id: "PC2", type: "pc" },
        ],
        links: [
          { a: "PC1:Fa0", b: "R1:Gi0/0" },
          { a: "R1:Gi0/1", b: "R2:Gi0/0" },
          { a: "R2:Gi0/1", b: "R3:Gi0/0" },
          { a: "R3:Gi0/1", b: "PC2:Fa0" },
        ],
      },
      {
        PC1: ["ip address 10.1.1.10 255.255.255.0 10.1.1.1"],
        PC2: ["ip address 10.3.3.10 255.255.255.0 10.3.3.1"],
        R1: [
          "interface Gi0/0", "ip address 10.1.1.1 255.255.255.0", "no shutdown",
          "interface Gi0/1", "ip address 10.12.0.1 255.255.255.252", "no shutdown", "exit",
          "router ospf 1", "network 10.0.0.0 0.255.255.255 area 0",
        ],
        R2: [
          "interface Gi0/0", "ip address 10.12.0.2 255.255.255.252", "no shutdown",
          "interface Gi0/1", "ip address 10.23.0.1 255.255.255.252", "no shutdown", "exit",
          "router ospf 1", "network 10.0.0.0 0.255.255.255 area 0",
        ],
        R3: [
          "interface Gi0/0", "ip address 10.23.0.2 255.255.255.252", "no shutdown",
          "interface Gi0/1", "ip address 10.3.3.1 255.255.255.0", "no shutdown", "exit",
          "router ospf 1", "network 10.0.0.0 0.255.255.255 area 0",
        ],
      },
    );
    expect(sim.ping("PC1", "10.3.3.10")).toBe(true);
    sim.execute("R2", "enable");
    const nb = sim.execute("R2", "show ip ospf neighbor").output;
    expect(nb).toContain("FULL");
    expect(nb.split("\n").length).toBe(3); // en-tête + 2 voisins
    sim.execute("R1", "enable");
    const rt = sim.execute("R1", "show ip route").output;
    expect(rt).toMatch(/O\s+10\.3\.3\.0\/24 \[110\/3\] via 10\.12\.0\.2/);
    // un wildcard différent coupe l'adjacence
    sim.execute("R2", "conf t");
    sim.execute("R2", "router ospf 1");
    sim.execute("R2", "no network 10.0.0.0 0.255.255.255 area 0");
    expect(sim.ping("PC1", "10.3.3.10")).toBe(false);
  });
});
