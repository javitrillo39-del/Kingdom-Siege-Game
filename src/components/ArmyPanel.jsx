import { HeartPulse, Shield, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../i18n/index.js";

export default function ArmyPanel({ game, power, busy, onTrain, onRepair }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;
  return (
    <div className="armyGrid">
      <article className="armyCard troopCard">
        <div className="armyCardHeading">
          <span className="buildingIcon">
            <Users size={24} aria-hidden="true" />
          </span>
          <span className="eyebrow">{t("army.fieldForce")}</span>
        </div>
        <small className="statLabel">{t("army.activeTroops")}</small>
        <strong className="armyStat">{formatNumber(game.troops, locale)}</strong>
        <p className="armyDetail">
          {t("army.combatPower")} <b>{formatNumber(power, locale)}</b>
        </p>
        <button
          className="primaryButton wideButton"
          disabled={busy}
          onClick={onTrain}
          type="button"
        >
          <Users size={17} aria-hidden="true" />
          {t("army.train")}
          <span className="buttonCost">{t("army.trainCost")}</span>
        </button>
      </article>

      <article className="armyCard wallCard">
        <div className="armyCardHeading">
          <span className="buildingIcon">
            <Shield size={24} aria-hidden="true" />
          </span>
          <span className="eyebrow">{t("army.kingdomDefense")}</span>
        </div>
        <small className="statLabel">{t("army.wallIntegrity")}</small>
        <strong className="armyStat">{formatNumber(game.health, locale)}%</strong>
        <div
          className="bar"
          role="progressbar"
          aria-label={t("army.wallIntegrity")}
          aria-valuenow={game.health}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ width: `${game.health}%` }} />
        </div>
        <button
          className="secondaryButton wideButton"
          disabled={busy}
          onClick={onRepair}
          type="button"
        >
          <HeartPulse size={17} aria-hidden="true" />
          {t("army.repair")}
          <span className="buttonCost">{t("army.repairCost")}</span>
        </button>
      </article>
    </div>
  );
}
