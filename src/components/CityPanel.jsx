import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  CircleCheck,
  Coins,
  Hammer,
  Leaf,
  Wheat,
  Wind,
} from "lucide-react";
import { buildings } from "../data/gameConfig.js";
import { formatNumber } from "../i18n/index.js";

const resourceRates = [
  { key: "food", label: "common.food", Icon: Wheat, color: "food" },
  { key: "wood", label: "common.wood", Icon: Leaf, color: "wood" },
  { key: "gold", label: "common.gold", Icon: Coins, color: "gold" },
];

export default function CityPanel({ game, busy, rates, power, onUpgrade }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;
  const formatRate = (rate) => rate === null
    ? "—"
    : formatNumber(rate, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const formatResource = (value) => formatNumber(value, locale);
  const [selectedId, setSelectedId] = useState("farm");
  const [upgradedId, setUpgradedId] = useState(null);
  const previousLevels = useRef(game);
  const selected = buildings[selectedId];
  const selectedLevel = game[selectedId];
  const woodCost = selected.base * selectedLevel;
  const goldCost = Math.ceil(woodCost / 2);
  const missingWood = Math.max(0, woodCost - game.wood);
  const missingGold = Math.max(0, goldCost - game.gold);
  const canUpgrade = missingWood === 0 && missingGold === 0;
  const SelectedIcon = selected.Icon;

  useEffect(() => {
    const oldLevels = previousLevels.current;
    const upgradedBuilding = Object.keys(buildings).find(
      (id) => game[id] > oldLevels[id],
    );

    previousLevels.current = game;

    if (upgradedBuilding) {
      setUpgradedId(upgradedBuilding);
    }
  }, [game]);

  useEffect(() => {
    if (!upgradedId) return undefined;
    const timerId = window.setTimeout(() => setUpgradedId(null), 850);
    return () => window.clearTimeout(timerId);
  }, [upgradedId]);

  return (
    <div className="cityView">
      <div className="cityEconomy" aria-label={t("city.observedProduction")}>
        <div className="economyHeading">
          <Wind size={15} aria-hidden="true" />
          <span>
            <b>{t("city.realmOutput")}</b>
            <small>{t("city.measuredProduction")}</small>
          </span>
        </div>
        {resourceRates.map(({ key, label, Icon, color }) => (
          <div className={`economyRate economyRate-${color}`} key={key}>
            <Icon size={16} aria-hidden="true" />
            <span className="economyRateValue">
              <b>+{formatRate(rates[key])}</b>
              <small>{t("city.perSecond", { resource: t(label) })}</small>
            </span>
          </div>
        ))}
      </div>

      <div className="cityScene">
        <section className="cityMap" aria-label={t("city.cityBuilding")}>
          <div className="cityMapHeader">
            <span className="mapSeal">KS</span>
            <span>
              <span className="eyebrow">{t("city.innerRealm")}</span>
              <b>Kingdom of Astrava</b>
            </span>
            <span className="cityPopulation">
              <span className="populationDot" />
              {t("city.realmActive")}
            </span>
          </div>

          <div className="cityLandscape" aria-hidden="true">
            <span className="landmarkHill landmarkHill-far" />
            <span className="landmarkHill landmarkHill-near" />
            <span className="landmarkRiver" />
            <span className="landmarkRoad" />
            <span className="landmarkTree landmarkTree-one" />
            <span className="landmarkTree landmarkTree-two" />
            <span className="landmarkTree landmarkTree-three" />
            <span className="landmarkTree landmarkTree-four" />
            <span className="landmarkField" />
          </div>

          <div className="cityPlots">
            {Object.entries(buildings).map(([id, building], index) => {
              const Icon = building.Icon;
              const nextWood = building.base * game[id];
              const nextGold = Math.ceil(nextWood / 2);
              const affordable = game.wood >= nextWood && game.gold >= nextGold;

              return (
                <button
                  aria-pressed={selectedId === id}
                  className={[
                    "cityBuilding",
                    `cityBuilding-${id}`,
                    selectedId === id ? "is-selected" : "",
                    affordable ? "can-upgrade" : "needs-resources",
                    upgradedId === id ? "is-upgraded" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={id}
                  onClick={() => setSelectedId(id)}
                  style={{ "--plot-order": index }}
                  type="button"
                >
                  <span className="plotLevel">{t("city.levelShort", { level: formatNumber(game[id], locale) })}</span>
                  <span className="plotStructure">
                    <span className="plotRoof" />
                    <span className="plotBuilding">
                      <Icon size={25} aria-hidden="true" />
                    </span>
                    <span className="plotDoor" />
                  </span>
                  <span className="plotName">{t(building.name)}</span>
                  <span className="plotStatus">
                    {affordable ? (
                      <>
                        <span className="readyDot" />
                        {t("city.readyToImprove")}
                      </>
                    ) : (
                      t("city.gatherResources")
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="cityMapFooter">
            <span>{t("city.chooseBuilding")}</span>
            <span className="mapCoordinates">{t("city.coordinates", { realm: "07" })}</span>
          </div>
        </section>

        <aside
          className={`buildingInspector${canUpgrade ? " inspectorReady" : ""}`}
          aria-live="polite"
          aria-label={t("city.buildingDetails", { building: t(selected.name) })}
        >
          <div className="inspectorTopline">
            <span className={`inspectorIcon inspectorIcon-${selectedId}`}>
              <SelectedIcon size={24} aria-hidden="true" />
            </span>
            <span className="levelBadge">{t("city.level", { level: formatNumber(selectedLevel, locale) })}</span>
          </div>

          <span className="eyebrow">{t("city.building")}</span>
          <h2>{t(selected.name)}</h2>
          <p className="inspectorSummary">{t(selected.benefit)}</p>

          <div className="inspectorStats">
            <span>{t("city.currentLevel")}</span>
            <b>{formatNumber(selectedLevel, locale)}</b>
            {selected.resource ? (
              <>
                <span>{t("city.observedRealmRate")}</span>
                <b className="rateValue">
                  +{formatRate(rates[selected.resource])}{" "}
                  {t("city.perSecond", { resource: t(`common.${selected.resource}`) })}
                </b>
              </>
            ) : (
              <>
                <span>{t("city.combatPower")}</span>
                <b className="rateValue">{formatNumber(power, locale)}</b>
              </>
            )}
          </div>

          <div className="nextUpgrade">
            <span className="eyebrow">{t("city.nextImprovement")}</span>
            <div className="nextLevel">
              {t("city.nextLevel", {
                current: formatNumber(selectedLevel, locale),
                next: formatNumber(selectedLevel + 1, locale),
              })}
            </div>
            <p>{t(selected.output)}</p>
            {selected.resource && (
              <div className="outputCallout">
                <Wind size={14} aria-hidden="true" />
                {t("city.currentRealmOutput", {
                  rate: formatRate(rates[selected.resource]),
                  resource: t(`common.${selected.resource}`),
                })}
              </div>
            )}
          </div>

          <div className="upgradeCost">
            <span className="eyebrow">{t("city.cost")}</span>
            <span>
              <Leaf size={15} aria-hidden="true" />
              {formatResource(woodCost)} {t("common.wood")}
            </span>
            <span>
              <Coins size={15} aria-hidden="true" />
              {formatResource(goldCost)} {t("common.gold")}
            </span>
          </div>

          {canUpgrade ? (
            <p className="resourceHint resourceHint-ready">
              <CircleCheck size={14} aria-hidden="true" />
              {t("city.resourceReady")}
            </p>
          ) : (
            <p className="resourceHint resourceHint-missing">
              {t("city.need")}
              {missingWood > 0 && ` ${t("city.moreResource", { amount: formatResource(missingWood), resource: t("common.wood") })}`}
              {missingWood > 0 && missingGold > 0 && ` ${t("city.and")}`}
              {missingGold > 0 && ` ${t("city.moreResource", { amount: formatResource(missingGold), resource: t("common.gold") })}`}
            </p>
          )}

          <button
            className={`primaryButton inspectorUpgrade${canUpgrade ? "" : " upgradeUnavailable"}`}
            disabled={busy}
            onClick={() => onUpgrade(selectedId)}
            type="button"
          >
            <Hammer size={16} aria-hidden="true" />
            {busy ? t("city.improving") : t("city.upgrade", { building: t(selected.name) })}
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
          <p className="serverAuthority">
            {t("city.serverAuthority")}
          </p>
        </aside>
      </div>
    </div>
  );
}
