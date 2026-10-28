export const CONDITION_KEYS = ["worksPerf", "minorIssues", "forParts"] as const;
export type ConditionKey = (typeof CONDITION_KEYS)[number];

// Canonical value stored in listings.condition (always English).
export const CONDITION_VALUES: Record<ConditionKey, string> = {
  worksPerf: "Works perfectly",
  minorIssues: "Minor issues",
  forParts: "For parts",
};

// Also accept the zh labels older listings were saved with.
const STORED_TO_KEY: Record<string, ConditionKey> = {
  "Works perfectly": "worksPerf",
  "Minor issues": "minorIssues",
  "For parts": "forParts",
  "運作完好": "worksPerf",
  "輕微問題": "minorIssues",
  "部分零件損壞": "forParts",
};

export function conditionKeyFromStored(value: string | null | undefined): ConditionKey | null {
  if (!value) return null;
  return STORED_TO_KEY[value.trim()] ?? null;
}
