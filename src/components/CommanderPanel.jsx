import { Crown, ScrollText, Trophy } from "lucide-react";

export default function CommanderPanel({ user, game, busy, message }) {
  return (
    <aside className="commanderPanel">
      <div className="commanderIdentity">
        <span className="commanderCrest">
          <Crown size={25} aria-hidden="true" />
        </span>
        <span className="eyebrow">ROYAL VANGUARD</span>
        <h2>{user.username}</h2>
        <span className="commanderRank">Commander · Realm 07</span>
      </div>

      <div className="reportHeading">
        <span className="reportIcon">
          <ScrollText size={17} aria-hidden="true" />
        </span>
        <h3>Kingdom report</h3>
      </div>
      <p className="reportMessage" role="status" aria-live="polite">
        {busy ? "Contacting the kingdom..." : message}
      </p>

      <div className="victoryCard">
        <span className="victoryIcon">
          <Trophy size={18} aria-hidden="true" />
        </span>
        <span className="victoryValue">{game.victories || 0}</span>
        <span className="victoryLabel">Victories</span>
      </div>

      <div className="commanderFooter">
        Your realm. Your legacy.
      </div>
    </aside>
  );
}
