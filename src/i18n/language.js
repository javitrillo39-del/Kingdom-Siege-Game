const supportedLanguages = ["en", "es-ES", "es-MX"];

export function resolveLanguage(savedLanguage, browserLanguages = []) {
  if (supportedLanguages.includes(savedLanguage)) return savedLanguage;

  const spanishLanguage = browserLanguages.find((language) =>
    language?.toLowerCase().startsWith("es"),
  );
  if (!spanishLanguage) return "en";
  return spanishLanguage.toLowerCase() === "es-mx" ? "es-MX" : "es-ES";
}
