// Human-readable type labels
export const TYPE_LABELS: Record<string, string> = {
  risk: "Risk",
  capability: "Capability",
  "safety-agenda": "Safety Agenda",
  policy: "Policy",
  approach: "Approach",
  project: "Project",
  organization: "Organization",
  lab: "Lab",
  "lab-frontier": "Lab",
  "lab-research": "Safety Org",
  "lab-academic": "Academic",
  researcher: "Person",
  funder: "Funder",
  crux: "Crux",
  concept: "Concept",
  model: "Model",
  argument: "Argument",
  analysis: "Analysis",
  historical: "Historical",
  table: "Table",
  diagram: "Diagram",
  insight: "Insight",
};

export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    risk: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    capability: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "safety-agenda": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    policy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    approach: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    project: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    organization: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    lab: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "lab-frontier": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "lab-research": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "lab-academic": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    researcher: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    crux: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    concept: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
    model: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    argument: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    analysis: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    historical: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
    funder: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    table: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    diagram: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    insight: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };
  return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
}

export function formatWordCount(count: number | null): string {
  if (!count) return "";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`;
  return `${count} words`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}
