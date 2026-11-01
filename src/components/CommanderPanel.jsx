import { Crown, ScrollText, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../i18n/index.js";

export default function CommanderPanel({ user, game, busy, message }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;
  return (
    <aside className="commanderPanel">
      <div className="commanderIdentity">
        <span className="commanderCrest">
          <Crown size={25} aria-hidden="true" />
        </span>
        <span className="eyebrow">{t("commander.vanguard")}</span>
        <h2>{user.username}</h2>
        <span className="commanderRank">{t("commander.rank", { realm: "07" })}</span>
      </div>

      <div className="reportHeading">
        <span className="reportIcon">
          <ScrollText size={17} aria-hidden="true" />
        </span>
        <h3>{t("commander.report")}</h3>
      </div>
      <p className="reportMessage" role="status" aria-live="polite">
        {busy ? t("commander.contacting") : t(message.key, message.values)}
      </p>

      <div className="victoryCard">
        <span className="victoryIcon">
          <Trophy size={18} aria-hidden="true" />
        </span>
        <span className="victoryValue">{formatNumber(game.victories || 0, locale)}</span>
        <span className="victoryLabel">{t("commander.victories")}</span>
      </div>

      <div className="commanderFooter">
        {t("commander.legacy")}
      </div>
    </aside>
  );
}
