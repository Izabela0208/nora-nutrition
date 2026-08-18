import { createContext, useContext, useState, useCallback, useEffect } from "react";
import en from "./en.json";
import ro from "./ro.json";

// The only two languages the app supports. profile.language stores one of these codes —
// never free text (see nora-nutrition CLAUDE.md decision: fixed selector replaced the old
// free-text field so the UI dictionary below can key off a known, finite set).
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ro", label: "Română" },
];

// Full language name for AI prompts (which need "Romanian", not "ro").
export const LANGUAGE_NAMES = { en: "English", ro: "Romanian" };

const DICTIONARIES = { en, ro };

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback ?? key,
});

export function LanguageProvider({ children }) {
  // Starts "en" (matches server render, avoids a hydration mismatch), then — before any
  // saved profile.language is known — switches to the browser's language if it's Romanian.
  // A loaded profile (NutritionApp) always overrides this via setLanguage once it arrives.
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    const nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    if (nav.startsWith("ro")) setLanguageState("ro");
  }, []);

  const setLanguage = useCallback((code) => {
    if (DICTIONARIES[code]) setLanguageState(code);
  }, []);

  // Falls back to the English string, then to the literal key, so missing translations
  // (expected until the dictionaries are populated in a later phase) never render blank.
  const t = useCallback((key, fallback) => {
    const dict = DICTIONARIES[language] || DICTIONARIES.en;
    return dict[key] ?? fallback ?? DICTIONARIES.en[key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
