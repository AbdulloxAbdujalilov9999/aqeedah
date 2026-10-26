// Uzbek Latin -> Cyrillic. Covers the official 1995 Latin alphabet; text in other
// scripts (Arabic, Cyrillic) passes through unchanged.

const APOS = "['‘’ʻʼ`]";

const PAIRS: [RegExp, string][] = [
  [new RegExp(`o${APOS}`, "g"), "ў"],
  [new RegExp(`O${APOS}`, "g"), "Ў"],
  [new RegExp(`g${APOS}`, "g"), "ғ"],
  [new RegExp(`G${APOS}`, "g"), "Ғ"],
  [/sh/g, "ш"], [/Sh|SH/g, "Ш"],
  [/ch/g, "ч"], [/Ch|CH/g, "Ч"],
  [/yo/g, "ё"], [/Yo|YO/g, "Ё"],
  [/yu/g, "ю"], [/Yu|YU/g, "Ю"],
  [/ya/g, "я"], [/Ya|YA/g, "Я"],
  [/ye/g, "е"], [/Ye|YE/g, "Е"],
  // e at the start of a word is э
  [/(^|[^A-Za-zА-Яа-яЎўҒғҚқҲҳ])e/g, "$1э"],
  [/(^|[^A-Za-zА-Яа-яЎўҒғҚқҲҳ])E/g, "$1Э"],
  // the remaining apostrophe is the tutuq belgisi
  [new RegExp(`(?<=[A-Za-zА-Яа-яЎўҒғҚқҲҳ])${APOS}(?=[A-Za-zА-Яа-яЎўҒғҚқҲҳ])`, "g"), "ъ"],
];

const SINGLE: Record<string, string> = {
  a: "а", b: "б", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л",
  m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х",
  y: "й", z: "з", c: "с", w: "в",
};

export function toCyrillic(text: string): string {
  if (!text) return text;
  // leave URLs, emails and inline code alone
  return text.split(/(https?:\/\/\S+|\S+@\S+|`[^`]*`)/g).map((part, i) => {
    if (i % 2 === 1) return part;
    let s = part;
    for (const [re, rep] of PAIRS) s = s.replace(re, rep);
    let out = "";
    for (const ch of s) {
      const lower = ch.toLowerCase();
      const mapped = SINGLE[lower];
      if (!mapped) out += ch;
      else out += ch === lower ? mapped : mapped.toUpperCase();
    }
    return out;
  }).join("");
}
