import { useState } from "react";
import { BookOpen, Bug, Lightbulb, RotateCcw, Send, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import useAssistant from "../hooks/useAssistant.js";
import "../styles/assistant.css";

export default function AssistantPanel({ activeSection = "assistant", username }) {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("help");
  const { history, suggestions, ask, clear } = useAssistant(activeSection);

  const submit = (event) => {
    event.preventDefault();
    ask(question);
    setQuestion("");
  };

  const submitReport = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const summary = t(mode === "bug" ? "assistant.report.bugPrepared" : "assistant.report.ideaPrepared", {
      section: form.get("section"),
      details: form.get("details"),
    });
    ask(summary);
    event.currentTarget.reset();
    setMode("help");
  };

  return (
    <div className="assistantShell">
      <aside className="assistantSidebar">
        <div className="assistantBrand">
          <span className="assistantSigil"><Sparkles size={24} /></span>
          <div>
            <span className="eyebrow">{t("assistant.eyebrow")}</span>
            <h2>{t("assistant.title")}</h2>
          </div>
        </div>
        <p>{t("assistant.intro", { username })}</p>
        <div className="assistantModes" aria-label={t("assistant.modes")}> 
          <button className={mode === "help" ? "active" : ""} onClick={() => setMode("help")}><BookOpen size={17} />{t("assistant.help")}</button>
          <button className={mode === "bug" ? "active" : ""} onClick={() => setMode("bug")}><Bug size={17} />{t("assistant.reportBug")}</button>
          <button className={mode === "idea" ? "active" : ""} onClick={() => setMode("idea")}><Lightbulb size={17} />{t("assistant.suggest")}</button>
        </div>
        {mode === "help" && (
          <div className="assistantSuggestions">
            <span>{t("assistant.tryAsking")}</span>
            {suggestions.map((topic) => (
              <button key={topic.id} onClick={() => ask(t(topic.suggestionKey))}>{t(topic.suggestionKey)}</button>
            ))}
          </div>
        )}
        <button className="assistantClear" onClick={clear}><RotateCcw size={15} />{t("assistant.clear")}</button>
      </aside>

      <section className="assistantConversation" aria-label={t("assistant.conversation")}>
        {mode === "help" ? (
          <>
            <div className="assistantMessages" aria-live="polite">
              {history.map((item) => (
                <div key={item.id} className={`assistantMessage ${item.role}`}>
                  <span>{item.role === "assistant" ? t("assistant.name") : username}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
            <form className="assistantComposer" onSubmit={submit}>
              <label htmlFor="assistant-question">{t("assistant.askLabel")}</label>
              <div>
                <input id="assistant-question" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} placeholder={t("assistant.placeholder")} />
                <button disabled={!question.trim()} aria-label={t("assistant.send")}><Send size={18} /></button>
              </div>
              <small>{t("assistant.freeNotice")}</small>
            </form>
          </>
        ) : (
          <form className="assistantReport" onSubmit={submitReport}>
            {mode === "bug" ? <Bug size={44} /> : <Lightbulb size={44} />}
            <h3>{t(mode === "bug" ? "assistant.report.bugTitle" : "assistant.report.ideaTitle")}</h3>
            <p>{t(mode === "bug" ? "assistant.report.bugIntro" : "assistant.report.ideaIntro")}</p>
            <label>{t("assistant.report.section")}</label>
            <select name="section" required defaultValue={activeSection}>
              {["city", "army", "map", "social", "chat", "assistant"].map((section) => <option key={section} value={section}>{t(`navigation.${section}`)}</option>)}
            </select>
            <label>{t("assistant.report.details")}</label>
            <textarea name="details" required minLength={10} maxLength={600} placeholder={t("assistant.report.detailsPlaceholder")} />
            <button><Send size={17} />{t("assistant.report.prepare")}</button>
            <small>{t("assistant.report.localOnly")}</small>
          </form>
        )}
      </section>
    </div>
  );
}
