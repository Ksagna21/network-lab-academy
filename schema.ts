import { z } from "zod";
import { CheckSchema, type Check } from "@/engine/checks";
import type { TopologyDef } from "@/engine/types";

export const LabSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  description: z.string(),
  category: z.enum(["fondamentaux", "switching", "routage", "securite", "voip"]),
  difficulty: z.enum(["débutant", "intermédiaire", "avancé"]),
  estimatedMinutes: z.number().positive(),
  xpReward: z.number().nonnegative(),
  /** Paragraphes d'instructions ; `code` entre backticks est mis en forme. */
  instructions: z.array(z.string()),
  topology: z.object({
    devices: z.array(
      z.object({
        id: z.string(),
        type: z.enum(["router", "switch", "pc"]),
        hostname: z.string().optional(),
        label: z.string().optional(),
        x: z.number().min(0).max(100).optional(),
        y: z.number().min(0).max(100).optional(),
      }),
    ),
    links: z.array(z.object({ a: z.string(), b: z.string() })),
  }),
  /** Commandes appliquées au démarrage (mode config, ou mode PC pour les postes). */
  initialConfigs: z.record(z.array(z.string())).default({}),
  objectives: z.array(z.object({ id: z.string(), description: z.string(), check: CheckSchema })).min(1),
  hints: z.array(z.string()).default([]),
  /** Solution de référence (utilisée par les tests et le bouton « Voir la solution »). */
  solution: z.record(z.array(z.string())).default({}),
});

export interface Lab {
  id: string;
  title: string;
  description: string;
  category: "fondamentaux" | "switching" | "routage" | "securite" | "voip";
  difficulty: "débutant" | "intermédiaire" | "avancé";
  estimatedMinutes: number;
  xpReward: number;
  instructions: string[];
  topology: TopologyDef;
  initialConfigs: Record<string, string[]>;
  objectives: { id: string; description: string; check: Check }[];
  hints: string[];
  solution: Record<string, string[]>;
}
