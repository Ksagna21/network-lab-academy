import { LabSchema, type Lab } from "./schema";

const files = import.meta.glob("./*.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** Tous les labs Cisco, validés au chargement (une erreur de format est signalée avec le nom du fichier). */
export const ciscoLabs: Lab[] = Object.entries(files)
  .map(([path, raw]) => {
    const parsed = LabSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`Lab invalide (${path}) : ${parsed.error.message}`);
    return parsed.data as unknown as Lab;
  })
  .sort((a, b) => a.title.localeCompare(b.title, "fr"));

export const getLab = (id: string): Lab | undefined => ciscoLabs.find((l) => l.id === id);

export type { Lab };
