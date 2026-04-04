export function normalizePlatformInput(rawPlatform, fallback = "INSTAGRAM") {
  const normalized = String(rawPlatform || "")
    .trim()
    .toUpperCase()
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const platformMap = {
    INSTAGRAM: "INSTAGRAM",
    FACEBOOK: "FACEBOOK",
    TWITTER: "TWITTER",
    X: "TWITTER",
    TWITTER_X: "TWITTER",
    WHATSAPP: "WHATSAPP",
    WHATSAPP_STATUS: "WHATSAPP",
    GOOGLE_BUSINESS: "GOOGLE_BUSINESS",
    GOOGLE: "GOOGLE_BUSINESS",
  };

  return platformMap[normalized] || fallback;
}

export function normalizeLanguageInput(rawLanguage, fallback = "BILINGUAL") {
  const normalized = String(rawLanguage || "")
    .trim()
    .toUpperCase()
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const languageMap = {
    BILINGUAL: "BILINGUAL",
    HINDI_ENGLISH: "BILINGUAL",
    HINDI_AND_ENGLISH: "BILINGUAL",
    ENGLISH: "ENGLISH",
    ENGLISH_ONLY: "ENGLISH",
    HINDI: "HINDI",
    HINDI_ONLY: "HINDI",
  };

  return languageMap[normalized] || fallback;
}

