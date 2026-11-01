import { ArrowUpRight, Castle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { enemies } from "../data/gameConfig.js";
import { formatNumber } from "../i18n/index.js";

export default function MapPanel({ busy, onAttack }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;
  return (
    <div className="enemyGrid">
      {enemies.map((enemy, index) => (
        <article className={`enemyCard enemyCard-${enemy.id}`} key={enemy.id}>
          <div className="enemyIcon">
            <Castle size={34} aria-hidden="true" />
          </div>
          <span className="eyebrow">{t("map.hostileTerritory", {
            number: formatNumber(index + 1, locale, { minimumIntegerDigits: 2 }),
          })}</span>
          <h2>{t(enemy.name)}</h2>
          <div className="enemyStats">
            <span>
              {t("map.power")} <b>{formatNumber(enemy.power, locale)}</b>
            </span>
            <span>
              {t("map.bounty")} <b>{t("map.reward", { amount: formatNumber(enemy.reward, locale) })}</b>
            </span>
          </div>
          <button
            className="primaryButton attackButton"
            disabled={busy}
            onClick={() => onAttack(enemy.id)}
            type="button"
          >
            {t("map.attack")}
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </article>
      ))}
    </div>
  );
}
