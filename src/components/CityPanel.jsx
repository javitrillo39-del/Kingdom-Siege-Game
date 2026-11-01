import { useEffect, useRef, useState } from "react";
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

const resourceRates = [
  { key: "food", label: "Food", Icon: Wheat, color: "food" },
  { key: "wood", label: "Wood", Icon: Leaf, color: "wood" },
  { key: "gold", label: "Gold", Icon: Coins, color: "gold" },
];

function formatRate(rate) {
  return rate === null ? "—" : rate.toFixed(1);
}

function formatResource(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function CityPanel({ game, busy, rates, power, onUpgrade }) {
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
      <div className="cityEconomy" aria-label="Observed realm production">
        <div className="economyHeading">
          <Wind size={15} aria-hidden="true" />
          <span>
            <b>Realm output</b>
            <small>Measured from live resource collection</small>
          </span>
        </div>
        {resourceRates.map(({ key, label, Icon, color }) => (
          <div className={`economyRate economyRate-${color}`} key={key}>
            <Icon size={16} aria-hidden="true" />
            <span className="economyRateValue">
              <b>+{formatRate(rates[key])}</b>
              <small>{label}/sec</small>
            </span>
          </div>
        ))}
      </div>

      <div className="cityScene">
        <section className="cityMap" aria-label="Select a city building">
          <div className="cityMapHeader">
            <span className="mapSeal">KS</span>
            <span>
              <span className="eyebrow">THE INNER REALM</span>
              <b>Kingdom of Astrava</b>
            </span>
            <span className="cityPopulation">
              <span className="populationDot" />
              Realm active
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
                  <span className="plotLevel">LVL {game[id]}</span>
                  <span className="plotStructure">
                    <span className="plotRoof" />
                    <span className="plotBuilding">
                      <Icon size={25} aria-hidden="true" />
                    </span>
                    <span className="plotDoor" />
                  </span>
                  <span className="plotName">{building.name}</span>
                  <span className="plotStatus">
                    {affordable ? (
                      <>
                        <span className="readyDot" />
                        Ready to improve
                      </>
                    ) : (
                      "Gather resources"
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="cityMapFooter">
            <span>Choose a building to inspect its next improvement</span>
            <span className="mapCoordinates">ASTRAVA · 07</span>
          </div>
        </section>

        <aside
          className={`buildingInspector${canUpgrade ? " inspectorReady" : ""}`}
          aria-live="polite"
          aria-label={`${selected.name} details`}
        >
          <div className="inspectorTopline">
            <span className={`inspectorIcon inspectorIcon-${selectedId}`}>
              <SelectedIcon size={24} aria-hidden="true" />
            </span>
            <span className="levelBadge">LEVEL {selectedLevel}</span>
          </div>

          <span className="eyebrow">CITY BUILDING</span>
          <h2>{selected.name}</h2>
          <p className="inspectorSummary">{selected.benefit}</p>

          <div className="inspectorStats">
            <span>Current level</span>
            <b>{selectedLevel}</b>
            {selected.resource ? (
              <>
                <span>Observed realm rate</span>
                <b className="rateValue">
                  +{formatRate(rates[selected.resource])}{" "}
                  {selected.resource}/sec
                </b>
              </>
            ) : (
              <>
                <span>Combat power</span>
                <b className="rateValue">{power}</b>
              </>
            )}
          </div>

          <div className="nextUpgrade">
            <span className="eyebrow">NEXT IMPROVEMENT</span>
            <div className="nextLevel">
              Level {selectedLevel} <ArrowUpRight size={14} /> Level{" "}
              {selectedLevel + 1}
            </div>
            <p>{selected.output}</p>
            {selected.resource && (
              <div className="outputCallout">
                <Wind size={14} aria-hidden="true" />
                Current realm output: +{formatRate(rates[selected.resource])}{" "}
                {selected.resource}/sec
              </div>
            )}
          </div>

          <div className="upgradeCost">
            <span className="eyebrow">COST</span>
            <span>
              <Leaf size={15} aria-hidden="true" />
              {formatResource(woodCost)} wood
            </span>
            <span>
              <Coins size={15} aria-hidden="true" />
              {formatResource(goldCost)} gold
            </span>
          </div>

          {canUpgrade ? (
            <p className="resourceHint resourceHint-ready">
              <CircleCheck size={14} aria-hidden="true" />
              Resources ready
            </p>
          ) : (
            <p className="resourceHint resourceHint-missing">
              Need
              {missingWood > 0 && ` ${formatResource(missingWood)} more wood`}
              {missingWood > 0 && missingGold > 0 && " and"}
              {missingGold > 0 && ` ${formatResource(missingGold)} more gold`}
            </p>
          )}

          <button
            className={`primaryButton inspectorUpgrade${canUpgrade ? "" : " upgradeUnavailable"}`}
            disabled={busy}
            onClick={() => onUpgrade(selectedId)}
            type="button"
          >
            <Hammer size={16} aria-hidden="true" />
            {busy ? "Improving..." : `Upgrade ${selected.name}`}
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
          <p className="serverAuthority">
            The kingdom server confirms all improvements.
          </p>
        </aside>
      </div>
    </div>
  );
}
