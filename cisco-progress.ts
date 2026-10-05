// Progression des labs Cisco, stockée dans le navigateur (localStorage).
// Étape suivante prévue : table Supabase pour synchroniser la progression entre appareils.
const KEY = "netacademy.cisco-labs.v1";

export interface LabProgress {
  completedAt?: string;
  bestObjectives: number;
}

export function loadProgress(): Record<string, LabProgress> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveProgress(labId: string, objectivesDone: number, total: number): LabProgress {
  const all = loadProgress();
  const prev = all[labId];
  const next: LabProgress = {
    bestObjectives: Math.max(prev?.bestObjectives ?? 0, objectivesDone),
    completedAt: prev?.completedAt ?? (objectivesDone >= total ? new Date().toISOString() : undefined),
  };
  all[labId] = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* stockage indisponible : la progression reste en mémoire pour la session */
  }
  return next;
}
