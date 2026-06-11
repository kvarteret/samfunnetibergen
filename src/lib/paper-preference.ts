export const PAPER_STORAGE_KEY = "samfunnet-paper";

export const paperOptions = [
  { value: "grid", label: "Rutenett" },
  { value: "dots", label: "Punktark" },
  { value: "ruled", label: "Linjert" },
  { value: "none", label: "Blankt." },
] as const;

export type PaperStyle = (typeof paperOptions)[number]["value"];

export function isPaperStyle(value: string | undefined): value is PaperStyle {
  return paperOptions.some((option) => option.value === value);
}

export const paperPreferenceScript = `
try {
  var paper = localStorage.getItem("${PAPER_STORAGE_KEY}");
  if (paper === "grid" || paper === "dots" || paper === "ruled" || paper === "none") {
    document.documentElement.dataset.paper = paper;
  }
} catch {}
`;
