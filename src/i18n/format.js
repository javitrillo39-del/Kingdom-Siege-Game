export function intlLocale(language) {
  if (language === "es-ES") return "es-ES";
  if (language === "es-MX") return "es-MX";
  return "en-US";
}

export function formatNumber(value, language, options) {
  return new Intl.NumberFormat(intlLocale(language), {
    useGrouping: "always",
    ...options,
  }).format(value);
}
