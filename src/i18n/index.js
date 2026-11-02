import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import "../styles/languages.css";
import en from "./locales/en.json";
import esES from "./locales/es-ES.json";
import esMX from "./locales/es-MX.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import zhCN from "./locales/zh-CN.json";
import { formatNumber, intlLocale } from "./format.js";

const LANGUAGE_STORAGE_KEY = "ks_language";
const supportedLanguages = ["en", "es-ES", "es-MX", "fr", "ar", "zh-CN"];

function normalizeLanguage(value = "") {
  const language = String(value).replace("_", "-").toLowerCase();
  if (language.startsWith("es-mx")) return "es-MX";
  if (language.startsWith("es")) return "es-ES";
  if (language.startsWith("fr")) return "fr";
  if (language.startsWith("ar")) return "ar";
  if (language.startsWith("zh")) return "zh-CN";
  return "en";
}

function detectLanguage() {
  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (supportedLanguages.includes(savedLanguage)) return savedLanguage;
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return normalizeLanguage(browserLanguages[0]);
}

function applyDocumentLanguage(language) {
  const resolved = normalizeLanguage(language);
  document.documentElement.lang = resolved;
  document.documentElement.dir = "ltr";
  document.body.dataset.language = resolved;
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
    fr: { translation: fr },
    ar: { translation: ar },
    "zh-CN": { translation: zhCN },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on("languageChanged", applyDocumentLanguage);
applyDocumentLanguage(i18n.resolvedLanguage || i18n.language);

export const languageOptions = [
  { value: "en", label: "English" },
  { value: "es-ES", label: "Español (España)" },
  { value: "es-MX", label: "Español (México)" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
  { value: "zh-CN", label: "简体中文" },
];

export { formatNumber, intlLocale };
export default i18n;
