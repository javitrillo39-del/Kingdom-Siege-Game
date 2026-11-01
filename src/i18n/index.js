import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import esES from "./locales/es-ES.json";
import esMX from "./locales/es-MX.json";
import { formatNumber, intlLocale } from "./format.js";
import { resolveLanguage } from "./language.js";

const LANGUAGE_STORAGE_KEY = "ks_language";
const supportedLanguages = ["en", "es-ES", "es-MX"];

function detectLanguage() {
  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return resolveLanguage(savedLanguage, browserLanguages);
}

export function changeAppLanguage(language) {
  if (!supportedLanguages.includes(language)) return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  void i18n.changeLanguage(language);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "es-ES": { translation: esES },
    "es-MX": { translation: esMX },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  interpolation: { escapeValue: false },
  returnNull: false,
});
i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
});
document.documentElement.lang = i18n.resolvedLanguage || i18n.language;

export const languageOptions = [
  { value: "en", label: "English" },
  { value: "es-ES", label: "Español (España)" },
  { value: "es-MX", label: "Español (México)" },
];

export { formatNumber, intlLocale };

export default i18n;
