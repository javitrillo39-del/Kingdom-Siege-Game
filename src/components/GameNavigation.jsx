import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { navigation } from "../data/gameConfig.js";

export default function GameNavigation({ activePanel, onChange, onLogout }) {
  const { t } = useTranslation();
  return (
    <nav className="gameNavigation" aria-label={t("navigation.sections")}>
      <span className="navLabel">{t("navigation.realm")}</span>
      {navigation.map(({ id, label, Icon }) => (
        <button
          className={`navButton${activePanel === id ? " active" : ""}`}
          onClick={() => onChange(id)}
          aria-current={activePanel === id ? "page" : undefined}
          key={id}
          type="button"
        >
          <Icon size={21} aria-hidden="true" />
          <span>{t(label)}</span>
        </button>
      ))}
      <button className="navButton logout" onClick={onLogout} type="button">
        <LogOut size={20} aria-hidden="true" />
        <span>{t("navigation.exit")}</span>
      </button>
    </nav>
  );
}
