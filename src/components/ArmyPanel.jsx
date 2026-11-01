import { HeartPulse, Shield, Users } from "lucide-react";

export default function ArmyPanel({ game, power, busy, onTrain, onRepair }) {
  return (
    <div className="armyGrid">
      <article className="armyCard troopCard">
        <div className="armyCardHeading">
          <span className="buildingIcon">
            <Users size={24} aria-hidden="true" />
          </span>
          <span className="eyebrow">FIELD FORCE</span>
        </div>
        <small className="statLabel">ACTIVE TROOPS</small>
        <strong className="armyStat">{game.troops}</strong>
        <p className="armyDetail">
          Combat power <b>{power}</b>
        </p>
        <button
          className="primaryButton wideButton"
          disabled={busy}
          onClick={onTrain}
          type="button"
        >
          <Users size={17} aria-hidden="true" />
          Train 5
          <span className="buttonCost">50 food · 20 gold</span>
        </button>
      </article>

      <article className="armyCard wallCard">
        <div className="armyCardHeading">
          <span className="buildingIcon">
            <Shield size={24} aria-hidden="true" />
          </span>
          <span className="eyebrow">KINGDOM DEFENSE</span>
        </div>
        <small className="statLabel">WALL INTEGRITY</small>
        <strong className="armyStat">{game.health}%</strong>
        <div
          className="bar"
          role="progressbar"
          aria-label="Wall integrity"
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
          Repair walls
          <span className="buttonCost">40 wood</span>
        </button>
      </article>
    </div>
  );
}
