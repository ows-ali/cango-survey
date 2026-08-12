/**
 * Supported research target languages. Each variant is a separate entry point
 * (URL param), so participants never need to know the research covers both.
 */

export type LangCode = "de" | "it";

export interface LangConfig {
  code: LangCode;
  targetLanguageName: string;
  landingTitle: string;
  landingSubtitle: string;
  primaryCta: string;
  microLabel: string;
}

export const LANGUAGES: Record<LangCode, LangConfig> = {
  de: {
    code: "de",
    targetLanguageName: "German",
    landingTitle: "Help us understand how people really learn German",
    landingSubtitle:
      "We're researching the biggest challenges people face when learning German. This takes about 5 minutes.",
    primaryCta: "Start voice interview",
    microLabel: "Language learning research",
  },
  it: {
    code: "it",
    targetLanguageName: "Italian",
    landingTitle: "Help us understand how people really learn Italian",
    landingSubtitle:
      "We're researching the biggest challenges people face when learning Italian. This takes about 5 minutes.",
    primaryCta: "Start voice interview",
    microLabel: "Language learning research",
  },
};

export const DEFAULT_LANG: LangCode = "de";

export const LANG_CODES: LangCode[] = ["de", "it"];

export function isLangCode(value: string | null): value is LangCode {
  return value !== null && (value === "de" || value === "it");
}

export function getLang(code: string | null): LangConfig {
  return LANGUAGES[isLangCode(code) ? code : DEFAULT_LANG];
}
