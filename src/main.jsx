import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./i18n/index.js";
import "./style.css";

createRoot(document.getElementById("root")).render(<App />);
