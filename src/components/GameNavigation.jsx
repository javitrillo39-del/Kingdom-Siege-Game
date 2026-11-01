import { LogOut } from "lucide-react";
import { navigation } from "../data/gameConfig.js";

export default function GameNavigation({ activePanel, onChange, onLogout }) {
  return (
    <nav className="gameNavigation" aria-label="Kingdom sections">
      <span className="navLabel">REALM</span>
      {navigation.map(({ id, label, Icon }) => (
        <button
          className={`navButton${activePanel === id ? " active" : ""}`}
          onClick={() => onChange(id)}
          aria-current={activePanel === id ? "page" : undefined}
          key={id}
          type="button"
        >
          <Icon size={21} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
      <button className="navButton logout" onClick={onLogout} type="button">
        <LogOut size={20} aria-hidden="true" />
        <span>Exit</span>
      </button>
    </nav>
  );
}
