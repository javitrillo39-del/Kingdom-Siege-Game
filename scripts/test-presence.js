import assert from "node:assert/strict";
import test from "node:test";
import {
  hasCompatiblePresenceClaims,
  inspectSupabaseConfig,
} from "../src/services/presenceDiagnostics.js";
import { uniquePresencePlayers } from "../src/services/presenceState.js";

function player(publicPlayerId, username, activeSection = "City", presence_ref = "ref") {
  return { publicPlayerId, username, realm: "07", activeSection, presence_ref };
}

test("deduplicates multiple browser tabs for one public player", () => {
  const state = {
    "KS-AAAAAAAA": [
      player("KS-AAAAAAAA", "commander_a", "City", "tab-1"),
      player("KS-AAAAAAAA", "commander_a", "Social", "tab-2"),
    ],
  };

  const online = uniquePresencePlayers(state);

  assert.equal(online.length, 1);
  assert.equal(online[0].publicPlayerId, "KS-AAAAAAAA");
});

test("counts unique player IDs and reflects a disconnected account", () => {
  const stateWithThreePlayers = {
    "KS-AAAAAAAA": [player("KS-AAAAAAAA", "commander_a")],
    "KS-BBBBBBBB": [player("KS-BBBBBBBB", "commander_b", "Army")],
    "KS-CCCCCCCC": [player("KS-CCCCCCCC", "commander_c", "Map")],
  };

  assert.equal(uniquePresencePlayers(stateWithThreePlayers).length, 3);
  delete stateWithThreePlayers["KS-BBBBBBBB"];
  assert.equal(uniquePresencePlayers(stateWithThreePlayers).length, 2);
});

test("accepts only the public presence fields and known sections", () => {
  const state = {
    "KS-AAAAAAAA": [
      player("KS-AAAAAAAA", "commander_a"),
      { ...player("KS-AAAAAAAA", "commander_a"), email: "private@example.invalid" },
      player("KS-BBBBBBBB", "commander_b"),
      player("KS-CCCCCCCC", "commander_c", "Unknown"),
    ],
  };

  const online = uniquePresencePlayers(state);

  assert.equal(online.length, 1);
  assert.deepEqual(
    Object.keys(online[0]).sort(),
    ["activeSection", "publicPlayerId", "realm", "username"],
  );
});

test("reports missing or malformed Supabase frontend configuration without exposing values", () => {
  assert.deepEqual(inspectSupabaseConfig("", ""), [
    "missing_supabase_url",
    "missing_publishable_key",
  ]);
  assert.deepEqual(
    inspectSupabaseConfig("https://project.supabase.co", "sb_publishable_short"),
    ["invalid_publishable_key"],
  );
  assert.deepEqual(
    inspectSupabaseConfig("https://project.supabase.co", `sb_publishable_${"a".repeat(32)}`),
    [],
  );
});

test("checks presence JWT claims without returning or logging token contents", () => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = [
    encode({ alg: "HS256", typ: "JWT" }),
    encode({
      aud: "authenticated",
      role: "authenticated",
      sub: "KS-AAAAAAAA",
      exp: Math.floor(Date.now() / 1000) + 60,
    }),
    Buffer.alloc(32).toString("base64url"),
  ].join(".");

  assert.equal(hasCompatiblePresenceClaims(token, "KS-AAAAAAAA"), true);
  assert.equal(hasCompatiblePresenceClaims(token, "KS-BBBBBBBB"), false);
  assert.equal(hasCompatiblePresenceClaims("not-a-token", "KS-AAAAAAAA"), false);
});
