const KNOWN_FRACTIONS = {
  "1/2": "½", "1/3": "⅓", "2/3": "⅔",
  "1/4": "¼", "3/4": "¾",
  "1/5": "⅕", "2/5": "⅖", "3/5": "⅗", "4/5": "⅘",
  "1/6": "⅙", "5/6": "⅚",
  "1/7": "⅐",
  "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞",
  "1/9": "⅑",
  "1/10": "⅒",
  "0/3": "↉",
};

const SUPERSCRIPT_DIGITS = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

const SUBSCRIPT_DIGITS = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
};

const FRACTION_SLASH = "⁄";

function fractionChar(numerator, denominator, useKnown = true) {
  if (denominator === 0) {
    throw new Error("Denominator cannot be zero.");
  }
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error("Numerator and denominator must be integers.");
  }
 
  const key = `${numerator}/${denominator}`;
  if (useKnown && KNOWN_FRACTIONS[key]) {
    return KNOWN_FRACTIONS[key];
  }
 
  const sup = String(numerator)
    .split("")
    .map((d) => SUPERSCRIPT_DIGITS[d] ?? d)
    .join("");
  const sub = String(denominator)
    .split("")
    .map((d) => SUBSCRIPT_DIGITS[d] ?? d)
    .join("");
 
  return `${sup}${FRACTION_SLASH}${sub}`;
}