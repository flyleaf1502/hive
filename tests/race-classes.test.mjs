import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hordeRaceClasses, isRaceClassAllowed, selectionForRace, UNKNOWN_CHOICE } from "../dist/race-classes.js";

test("new Forever Horde combinations and faction-specific Skyborne", () => {
  for (const [race, className] of [["Orc", "Mage"], ["Troll", "Warlock"], ["Undead", "Paladin"], ["Skyborne", "Shaman"], ["Skyborne", "Druid"]]) {
    assert.equal(isRaceClassAllowed(race, className), true, `${race}/${className}`);
  }
  for (const [race, className] of [["Skyborne", "Mage"], ["Skyborne", "Paladin"], ["Orc", "Paladin"], ["Undead", "Hunter"], ["Tauren", "Rogue"], ["Troll", "Druid"]]) {
    assert.equal(isRaceClassAllowed(race, className), false, `${race}/${className}`);
  }
  assert.equal(Object.values(hordeRaceClasses).flat().length, 28);
});

test("unknown choices are intentional; empty or unsupported choices are rejected", () => {
  assert.equal(isRaceClassAllowed(UNKNOWN_CHOICE, "Paladin"), true);
  assert.equal(isRaceClassAllowed("Tauren", UNKNOWN_CHOICE), true);
  assert.equal(isRaceClassAllowed(UNKNOWN_CHOICE, UNKNOWN_CHOICE), true);
  for (const race of ["", "Human", "__proto__", null]) assert.equal(isRaceClassAllowed(race, "Warrior"), false);
  for (const className of ["", "Death Knight", null]) assert.equal(isRaceClassAllowed(UNKNOWN_CHOICE, className), false);
});

test("race changes preserve compatible specs and clear incompatible selections", () => {
  assert.deepEqual(selectionForRace("Troll", "Mage", "Frost"), { className: "Mage", spec: "Frost" });
  assert.deepEqual(selectionForRace("Tauren", "Mage", "Frost"), { className: "", spec: "" });
  assert.deepEqual(selectionForRace("", "Warrior", "Protection"), { className: "", spec: "" });
  assert.deepEqual(selectionForRace(UNKNOWN_CHOICE, "Paladin", "Holy"), { className: "Paladin", spec: "Holy" });
});

test("migration and fresh database use the same concrete race/class matrix", () => {
  const migration = readFileSync(new URL("../db/migrations/2026-09-14-forever-race-class-combinations.sql", import.meta.url), "utf8");
  const schema = readFileSync(new URL("../db/supabase.sql", import.meta.url), "utf8");
  for (const sql of [migration, schema]) {
    for (const [race, classes] of Object.entries(hordeRaceClasses)) {
      const list = sql.match(new RegExp(`when p_race = '${race}' then p_class in \(([^)]+)\)`));
      assert.ok(list, `SQL definition for ${race}`);
      const sqlClasses = [...list[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
      assert.deepEqual(sqlClasses, classes);
    }
    assert.match(sql, /constraint registrations_race_class_check/);
  }
  assert.match(migration, /not valid;/i);
});
