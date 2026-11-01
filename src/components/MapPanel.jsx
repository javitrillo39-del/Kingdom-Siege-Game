import { ArrowUpRight, Castle } from "lucide-react";
import { enemies } from "../data/gameConfig.js";

export default function MapPanel({ busy, onAttack }) {
  return (
    <div className="enemyGrid">
      {enemies.map((enemy, index) => (
        <article className={`enemyCard enemyCard-${enemy.id}`} key={enemy.id}>
          <div className="enemyIcon">
            <Castle size={34} aria-hidden="true" />
          </div>
          <span className="eyebrow">HOSTILE TERRITORY · 0{index + 1}</span>
          <h2>{enemy.name}</h2>
          <div className="enemyStats">
            <span>
              POWER <b>{enemy.power}</b>
            </span>
            <span>
              BOUNTY <b>{enemy.reward} gold</b>
            </span>
          </div>
          <button
            className="primaryButton attackButton"
            disabled={busy}
            onClick={() => onAttack(enemy.id)}
            type="button"
          >
            Launch attack
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        </article>
      ))}
    </div>
  );
}
