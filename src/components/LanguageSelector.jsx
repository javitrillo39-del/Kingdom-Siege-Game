import { useTranslation } from "react-i18next";
import { changeAppLanguage, languageOptions } from "../i18n/index.js";

export default function LanguageSelector({ compact = false }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  return (
    <label className={`languageControl${compact ? " compact" : ""}`}>
      <span>{t("common.language")}</span>
      <select
        aria-label={t("common.language")}
        value={language}
        onChange={(event) => changeAppLanguage(event.target.value)}
      >
        {languageOptions.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
