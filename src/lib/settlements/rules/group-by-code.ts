const ENDS_WITH_WORD_CHARACTER = /[\p{L}\p{N}]$/u;
const STARTS_WITH_WORD_CHARACTER = /^[\p{L}\p{N}]/u;

/** True when the word occurs with no letter or digit right before or after it. */
function containsWord(text: string, word: string) {
  if (!word) return false;

  for (
    let at = text.indexOf(word);
    at !== -1;
    at = text.indexOf(word, at + 1)
  ) {
    const joinedBefore = ENDS_WITH_WORD_CHARACTER.test(text.slice(0, at));
    const joinedAfter = STARTS_WITH_WORD_CHARACTER.test(
      text.slice(at + word.length)
    );
    if (!joinedBefore && !joinedAfter) return true;
  }
  return false;
}

/**
 * The utility of a printed name: the one code of the settlement's summary rows
 * that it contains as a separate word. Null when it contains none or several.
 */
export function groupByCode(name: string, codes: string[]): string | null {
  const found = [...new Set(codes)].filter((code) => containsWord(name, code));
  return found.length === 1 ? found[0] : null;
}

const BRACKETED = /\(\s*([^()]+?)\s*\)/;

/** The unit of a utility: from its meter, else from brackets in a line name. */
export function utilityUnit(
  code: string,
  codes: string[],
  readings: Array<{ device: string; unit: string }>,
  lineNames: string[]
): string | null {
  const metered = readings.find((r) => groupByCode(r.device, codes) === code);
  if (metered) return metered.unit;

  for (const name of lineNames) {
    const unit = BRACKETED.exec(name)?.[1];
    if (unit && groupByCode(name, codes) === code) return unit;
  }
  return null;
}
