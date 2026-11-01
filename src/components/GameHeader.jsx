import { Coins, Crown, Heart, Swords, Trees, Wheat } from "lucide-react";

const resourceItems = [
  { label: "Food", field: "food", Icon: Wheat },
  { label: "Wood", field: "wood", Icon: Trees },
  { label: "Gold", field: "gold", Icon: Coins },
];

function Resource({ label, value, Icon }) {
  return (
    <div className="resource">
      <span className="resourceIcon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="resourceValue">
        <small>{label}</small>
        <b>{value}</b>
      </span>
    </div>
  );
}

export default function GameHeader({ game, power }) {
  return (
    <header className="gameHeader">
      <div className="brand">
        <span className="brandCrest">
          <Crown size={22} aria-hidden="true" />
        </span>
        <span className="brandWords">
          <small>REALM 07</small>
          <b>KINGDOM SIEGE</b>
        </span>
      </div>

      <div className="resources" aria-label="Kingdom resources">
        {resourceItems.map(({ label, field, Icon }) => (
          <Resource key={field} label={label} value={game[field]} Icon={Icon} />
        ))}
        <Resource label="Power" value={power} Icon={Swords} />
      </div>

      <div className="health" aria-label={`Walls at ${game.health}% integrity`}>
        <span className="healthIcon">
          <Heart size={20} fill="currentColor" aria-hidden="true" />
        </span>
        <span>
          <small>WALLS</small>
          <b>{game.health}%</b>
        </span>
      </div>
    </header>
  );
}
