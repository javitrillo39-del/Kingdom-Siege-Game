import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { formatNumber } from "../src/i18n/format.js";
import { resolveLanguage } from "../src/i18n/language.js";
import { apiErrorKey } from "../src/i18n/errors.js";

const localePaths = [
  new URL("../src/i18n/locales/en.json", import.meta.url),
  new URL("../src/i18n/locales/es-ES.json", import.meta.url),
  new URL("../src/i18n/locales/es-MX.json", import.meta.url),
];

function flatten(value, prefix = "", result = new Set()) {
  for (const [key, nestedValue] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (
      nestedValue &&
      typeof nestedValue === "object" &&
      !Array.isArray(nestedValue)
    ) {
      flatten(nestedValue, fullKey, result);
    } else {
      result.add(fullKey);
    }
  }
  return result;
}

const locales = await Promise.all(
  localePaths.map(async (path) => JSON.parse(await readFile(path, "utf8"))),
);
const [english, ...localized] = locales.map((locale) => flatten(locale));
const localeNames = ["es-ES", "es-MX"];
let hasMissingKeys = false;

for (let index = 0; index < localized.length; index += 1) {
  const missing = [...english].filter((key) => !localized[index].has(key));
  const extra = [...localized[index]].filter((key) => !english.has(key));
  console.log(
    `${localeNames[index]}: ${missing.length} missing, ${extra.length} extra`,
  );
  if (missing.length || extra.length) {
    hasMissingKeys = true;
    if (missing.length) console.error(`Missing: ${missing.join(", ")}`);
    if (extra.length) console.error(`Extra: ${extra.join(", ")}`);
  }
}

if (hasMissingKeys) process.exitCode = 1;

assert.equal(resolveLanguage("es-MX", ["en-US"]), "es-MX");
assert.equal(resolveLanguage(null, ["es-ES"]), "es-ES");
assert.equal(resolveLanguage(null, ["es-MX"]), "es-MX");
assert.equal(resolveLanguage(null, ["es-419"]), "es-ES");
assert.equal(resolveLanguage(null, ["fr-FR", "en-US"]), "en");
assert.equal(formatNumber(1234.56, "en"), "1,234.56");
assert.equal(formatNumber(1234.56, "es-ES"), "1.234,56");
assert.equal(formatNumber(1234.56, "es-MX"), "1,234.56");
for (const [code, expectedKey] of [
  ["NOT_ENOUGH_GOLD", "errors.notEnoughGold"],
  ["PLAYER_NOT_FOUND", "errors.playerNotFound"],
  ["FRIEND_REQUEST_EXISTS", "errors.friendRequestExists"],
  ["CHAT_RATE_LIMITED", "errors.chatRateLimited"],
]) {
  const key = apiErrorKey(new Error(code));
  assert.equal(key, expectedKey);
  assert.ok(english.has(key), `${code} must have an English translation`);
  assert.ok(localized.every((locale) => locale.has(key)), `${code} must have all Spanish translations`);
}
console.log("Language detection and Intl number formatting: passed");
