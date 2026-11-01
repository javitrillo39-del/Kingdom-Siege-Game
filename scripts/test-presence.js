import assert from "node:assert/strict";
import test from "node:test";
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
