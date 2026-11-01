import { Coins, Crown, Heart, Swords, Trees, Wheat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../i18n/index.js";
import LanguageSelector from "./LanguageSelector.jsx";

const resourceItems = [
  { label: "common.food", field: "food", Icon: Wheat },
  { label: "common.wood", field: "wood", Icon: Trees },
  { label: "common.gold", field: "gold", Icon: Coins },
];

function Resource({ label, value, Icon }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="resource">
      <span className="resourceIcon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="resourceValue">
        <small>{t(label)}</small>
        <b>{formatNumber(value, i18n.resolvedLanguage || i18n.language)}</b>
      </span>
    </div>
  );
}

export default function GameHeader({ game, power }) {
  const { t, i18n } = useTranslation();
  return (
    <header className="gameHeader">
      <div className="brand">
        <span className="brandCrest">
          <Crown size={22} aria-hidden="true" />
        </span>
        <span className="brandWords">
          <small>{t("header.realmNumber", { realm: "07" })}</small>
          <b>{t("header.kingdomName")}</b>
        </span>
      </div>

      <div className="resources" aria-label={t("header.resources")}>
        {resourceItems.map(({ label, field, Icon }) => (
          <Resource key={field} label={label} value={game[field]} Icon={Icon} />
        ))}
        <Resource label="common.power" value={power} Icon={Swords} />
      </div>

      <div className="health" aria-label={t("header.wallsIntegrity", { percent: game.health })}>
        <span className="healthIcon">
          <Heart size={20} fill="currentColor" aria-hidden="true" />
        </span>
        <span>
          <small>{t("header.walls")}</small>
          <b>{formatNumber(game.health, i18n.resolvedLanguage || i18n.language)}%</b>
        </span>
      </div>
      <LanguageSelector compact />
    </header>
  );
}
