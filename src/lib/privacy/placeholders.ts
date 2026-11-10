/** Fields the operator must fill in or remove, written `[[what to enter]]`. */
export const PLACEHOLDER_PATTERN = /\[\[[^\]]*\]\]/;
const PLACEHOLDER_PATTERN_GLOBAL = new RegExp(PLACEHOLDER_PATTERN, 'g');

export function placeholder(label: string): string {
  return `[[${label}]]`;
}

export function countPlaceholders(text: string): number {
  return text.match(PLACEHOLDER_PATTERN_GLOBAL)?.length ?? 0;
}
