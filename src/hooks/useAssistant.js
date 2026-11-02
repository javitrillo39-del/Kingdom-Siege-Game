import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { assistantTopics, contextualTopicIds } from "../data/assistantKnowledge.js";

const normalize = (value) => value
  .toLocaleLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export default function useAssistant(activeSection = "assistant") {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState(() => [
    { id: "welcome", role: "assistant", text: t("assistant.welcome") },
  ]);

  useEffect(() => {
    setHistory([{ id: `welcome-${Date.now()}`, role: "assistant", text: t("assistant.welcome") }]);
  }, [i18n.resolvedLanguage, t]);

  const suggestions = useMemo(() => {
    const ids = contextualTopicIds[activeSection] || contextualTopicIds.assistant;
    return ids
      .map((id) => assistantTopics.find((topic) => topic.id === id))
      .filter(Boolean);
  }, [activeSection]);

  const ask = useCallback((question) => {
    const cleanQuestion = question.trim().slice(0, 300);
    if (!cleanQuestion) return;
    const normalizedQuestion = normalize(cleanQuestion);
    const ranked = assistantTopics
      .map((topic) => ({
        topic,
        score: topic.keywords.reduce((score, keyword) => (
          normalizedQuestion.includes(normalize(keyword)) ? score + normalize(keyword).length : score
        ), 0),
      }))
      .sort((a, b) => b.score - a.score);
    const match = ranked[0]?.score > 0 ? ranked[0].topic : null;
    const answer = match ? t(match.answerKey) : t("assistant.answers.fallback");
    const stamp = Date.now();
    setHistory((items) => [
      ...items,
      { id: `user-${stamp}`, role: "user", text: cleanQuestion },
      { id: `assistant-${stamp}`, role: "assistant", text: answer },
    ]);
  }, [t]);

  const clear = useCallback(() => {
    setHistory([{ id: `welcome-${Date.now()}`, role: "assistant", text: t("assistant.welcome") }]);
  }, [t]);

  return { history, suggestions, ask, clear };
}
